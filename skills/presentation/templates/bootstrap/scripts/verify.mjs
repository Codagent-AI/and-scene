// Deterministic verification gate: whole-app build, reference check, and a real
// browser pass over every registered presentation's steps on 127.0.0.1.
// Usage: node scripts/verify.mjs [--reference <slug>]
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compareOutline } from './lib/outline.mjs'
import {
  HOST,
  launchBrowser,
  readHooks,
  readRegistry,
  run,
  sleep,
  startPreview,
  waitForIndex,
} from './lib/runtime.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const refFlag = argv.indexOf('--reference')
const referenceSlug = refFlag >= 0 ? argv[refFlag + 1] : null

class Failure extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

const log = (line) => console.log(`verify: ${line}`)

async function checkBuild() {
  const { code, output } = await run('npm', ['run', 'build'], { cwd: root, label: 'build' })
  if (code !== 0) throw new Failure('build', `npm run build failed\n${output.trim()}`)
  log('[build] PASS')
}

function checkRegistry() {
  const registry = readRegistry(root)
  if (registry.length === 0) throw new Failure('registry', 'no presentations are registered')
  for (const entry of registry) {
    if (!existsSync(path.join(root, 'src', 'presentations', entry.dir, 'Talk.tsx'))) {
      throw new Failure('registry', `"${entry.slug}" is registered but ${entry.dir}/Talk.tsx is missing`)
    }
  }
  if (referenceSlug && !registry.some((e) => e.slug === referenceSlug)) {
    throw new Failure('reference', `reference sample "${referenceSlug}" is not registered`)
  }
  log(`[registry] PASS (${registry.map((e) => e.slug).join(', ')})`)
  return registry
}

async function renderPresentation(browser, origin, slug) {
  const page = await browser.newPage()
  let current = 0
  const errors = []
  const note = (what) => errors.push({ step: current, what })
  page.on('console', (m) => m.type() === 'error' && note(`console.error: ${m.text()}`))
  page.on('pageerror', (e) => note(`uncaught exception: ${e.message}`))
  const fail = (message, step = current) => {
    throw new Failure('render', `"${slug}": ${message}`, step + 1)
  }
  const throwFirstError = () => {
    if (errors.length) fail(errors[0].what, errors[0].step)
  }

  try {
    await page.goto(`${origin}/${slug}`, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-presentation-root]', { timeout: 8000 })
    } catch {
      throwFirstError()
      fail('presentation chrome never rendered')
    }
    await sleep(200)
    throwFirstError()
    if ((await readHooks(page)).mode === 'present') await page.keyboard.press('p')
    const { count } = await readHooks(page)
    if (!(count > 0)) fail('data-step-count is missing or zero')

    const observed = []
    for (let i = 0; i < count; i++) {
      current = i
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await waitForIndex(page, i)
        } catch {
          throwFirstError()
          fail(`transition did not advance data-step-index to ${i}`)
        }
      }
      await sleep(150)
      throwFirstError()
      observed.push(
        await page.evaluate(() => ({
          title: document.querySelector('[data-presentation-step-title]')?.textContent ?? '',
          caption: document.querySelector('[data-presentation-caption]')?.textContent ?? '',
        })),
      )
    }
    if (slug === referenceSlug) {
      const mismatch = compareOutline(observed)
      if (mismatch) throw new Failure('reference', `"${slug}" does not match the outline: ${mismatch}`)
    }
    log(`[render] PASS ${slug} (${count} steps)`)
  } finally {
    await page.close()
  }
}

async function main() {
  await checkBuild()
  const registry = checkRegistry()
  const preview = await startPreview(root)
  log(`preview at ${preview.origin} (host ${HOST})`)
  let browser
  try {
    browser = await launchBrowser(root)
    for (const entry of registry) await renderPresentation(browser, preview.origin, entry.slug)
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

main().then(
  () => {
    log('PASS')
  },
  (err) => {
    if (err instanceof Failure) {
      const where = err.step ? `, step ${err.step}` : ''
      console.error(`verify: FAIL (phase: ${err.phase}${where}): ${err.message}`)
    } else {
      console.error(`verify: FAIL (phase: setup): ${err?.stack ?? err}`)
    }
    process.exitCode = 1
  },
)
