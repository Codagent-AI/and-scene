// Deterministic verification: production build, then a real-browser render of
// every registered presentation through every step. Exits non-zero on failure.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { readRegisteredSlugs } from './lib/registry.mjs'
import { launchBrowser, sleep, startPreview } from './lib/preview.mjs'

const root = path.resolve(import.meta.dirname, '..')
const SETTLE_MS = Number(process.env.VERIFY_SETTLE_MS ?? 400)
const STEP_TIMEOUT_MS = 4000

class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

const log = (msg) => console.log(`[verify] ${msg}`)

function phaseBuild() {
  const res = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8' })
  if (res.status !== 0) {
    process.stderr.write(`${res.stdout ?? ''}${res.stderr ?? ''}`)
    throw new VerifyError('build', `npm run build exited with status ${res.status}`)
  }
  log('build: ok')
}

async function loadOutline() {
  const file = path.join(root, 'scripts', 'reference-outline.mjs')
  return fs.existsSync(file) ? import(pathToFileURL(file).href) : null
}

function phaseRegistry(slugs, reference) {
  if (!reference) return
  if (!slugs.includes(reference.REFERENCE_SLUG)) {
    throw new VerifyError(
      'registry',
      `reference presentation "${reference.REFERENCE_SLUG}" is not registered in src/presentations/index.ts`,
    )
  }
  log(`registry: reference presentation "${reference.REFERENCE_SLUG}" registered`)
}

async function stepThrough(page, url, slug, outline) {
  const errors = []
  let current = 0
  const record = (text) => errors.push({ step: current, text })
  page.on('console', (msg) => msg.type() === 'error' && record(`console.error: ${msg.text()}`))
  page.on('pageerror', (err) => record(`uncaught error: ${err.message}`))

  const res = await page.goto(`${url}/${slug}`, { waitUntil: 'load' })
  if (!res?.ok()) throw new VerifyError('render', `/${slug} responded ${res?.status()}`, 0)
  try {
    await page.waitForSelector('[data-presentation-root]', { timeout: STEP_TIMEOUT_MS })
  } catch {
    throw new VerifyError('render', `/${slug} rendered no presentation`, 0)
  }
  const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
  if (outline && count !== outline.length) {
    throw new VerifyError('outline', `expected ${outline.length} steps, found ${count}`)
  }

  for (let i = 0; i < count; i++) {
    if (i > 0) {
      current = i
      await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction(
          (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
          i,
          { timeout: STEP_TIMEOUT_MS },
        )
      } catch {
        throw new VerifyError('render', `step ${i + 1} transition did not advance the step index`, i)
      }
    }
    await sleep(SETTLE_MS)
    if (outline) {
      const title = await page.textContent('[data-presentation-title]')
      const caption = await page.textContent('[data-presentation-caption]')
      const want = outline[i]
      if (title !== want.title || caption !== want.caption) {
        throw new VerifyError(
          'outline',
          `step ${i + 1} does not match the reference outline (expected "${want.title}", found "${title}")`,
          i,
        )
      }
    }
    const failure = errors.find((e) => e.step <= i)
    if (failure) {
      throw new VerifyError('render', `step ${failure.step + 1} emitted ${failure.text}`, failure.step)
    }
  }
  log(`render: /${slug} ok (${count} steps)`)
}

async function phaseRender(slugs, reference) {
  if (slugs.length === 0) throw new VerifyError('registry', 'no presentations are registered')
  const server = await startPreview(root)
  log(`preview: ${server.url}`)
  let browser
  try {
    browser = await launchBrowser()
    for (const slug of slugs) {
      const outline = reference && slug === reference.REFERENCE_SLUG ? reference.REFERENCE_OUTLINE : null
      const page = await browser.newPage()
      try {
        await stepThrough(page, server.url, slug, outline)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser?.close()
    await server.close()
  }
}

try {
  phaseBuild()
  const reference = await loadOutline()
  const slugs = readRegisteredSlugs(root)
  phaseRegistry(slugs, reference)
  await phaseRender(slugs, reference)
  log('PASS')
} catch (err) {
  if (err instanceof VerifyError) {
    const where = err.step === undefined ? '' : ` (step ${err.step + 1})`
    console.error(`[verify] FAIL ${err.phase}${where}: ${err.message}`)
  } else {
    console.error(`[verify] FAIL render: ${err instanceof Error ? err.message : err}`)
  }
  process.exitCode = 1
}
