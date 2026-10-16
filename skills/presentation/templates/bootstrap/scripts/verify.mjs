// Deterministic gate: build the whole app, then render every registered presentation in Chromium.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { ROOT, STEP_HOOK, advance, readRegistry, runBuild, startPreview, stepCount, stepIndex } from './lib.mjs'

class Failure extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

const required = JSON.parse(readFileSync(path.join(ROOT, 'scripts/verify.config.json'), 'utf8')).required ?? []

function phaseBuild() {
  console.log('[verify] phase=build: npm run build')
  const res = runBuild()
  if (res.status !== 0) {
    process.stdout.write(`${res.stdout ?? ''}${res.stderr ?? ''}`)
    throw new Failure('build', 'npm run build failed')
  }
}

function phaseRegistry() {
  console.log('[verify] phase=registry: reference presentations are registered')
  const slugs = readRegistry()
  for (const ref of required) {
    if (!slugs.includes(ref.slug)) throw new Failure('registry', `reference presentation "${ref.slug}" is not registered`)
  }
  if (slugs.length === 0) throw new Failure('registry', 'no presentations are registered')
  return slugs
}

async function renderPresentation(browser, base, slug, reference) {
  const page = await browser.newPage()
  let current = 0
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ step: current, text: msg.text() })
  })
  page.on('pageerror', (err) => errors.push({ step: current, text: String(err) }))
  const fail = (phase, message, step = current) => new Failure(phase, `[${slug}] ${message}`, step)
  try {
    const url = `${base}/${slug}`
    await page.goto(url, { waitUntil: 'load' })
    try {
      await page.waitForSelector(STEP_HOOK, { timeout: 8000 })
    } catch {
      throw fail('render', `no presentation chrome found at ${url}`, 0)
    }
    const count = await stepCount(page)
    if (!(count > 0)) throw fail('render', 'data-step-count is missing or zero', 0)
    if (reference && reference.steps.length !== count) {
      throw fail('sample', `expected ${reference.steps.length} steps but found ${count}`, 0)
    }
    for (let i = 0; i < count; i++) {
      current = i
      if (i > 0) {
        try {
          await advance(page, i)
        } catch {
          throw fail('transition', `ArrowRight did not advance to step index ${i} (stuck at ${await stepIndex(page)})`)
        }
      }
      await page.waitForTimeout(150)
      if (reference) {
        const want = reference.steps[i]
        const title = (await page.textContent('[data-presentation-title]'))?.trim()
        const caption = (await page.textContent('[data-presentation-caption]').catch(() => null))?.trim()
        if (title !== want.title || caption !== want.caption) {
          throw fail('sample', `step ${i} does not match the reference outline (got title "${title}")`)
        }
      }
      if (errors.length) throw fail('render', `browser error: ${errors[0].text}`, errors[0].step)
    }
    console.log(`[verify]   ${slug}: ${count} steps rendered cleanly`)
  } finally {
    await page.close()
  }
}

async function phaseRender(slugs) {
  console.log('[verify] phase=render: production preview on 127.0.0.1')
  const preview = await startPreview().catch((err) => {
    throw new Failure('render', err.message)
  })
  let browser
  try {
    browser = await chromium.launch()
    for (const slug of slugs) {
      await renderPresentation(browser, preview.base, slug, required.find((r) => r.slug === slug))
    }
  } finally {
    await browser?.close()
    preview.stop()
  }
}

try {
  phaseBuild()
  await phaseRender(phaseRegistry())
  console.log('[verify] PASS: build, registry, and render checks all passed')
} catch (err) {
  const where = err instanceof Failure ? `phase=${err.phase}${err.step === undefined ? '' : ` step=${err.step}`}` : 'phase=unknown'
  console.error(`[verify] FAIL ${where}: ${err.message}`)
  process.exitCode = 1
}
