// Production verification: build the whole app, check the reference sample is registered,
// and step through every sample step in Chromium against `vite preview` on 127.0.0.1.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { isMainModule, launchChromium, projectRoot, registryEntry, run, sleep, startPreview } from './lib/common.mjs'

export class VerifyError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

export function loadConfig(root = projectRoot) {
  return JSON.parse(readFileSync(path.join(root, 'verify.config.json'), 'utf8'))
}

/** The sample must be registered and its loader must point at a presentation module. */
export function checkRegistry(config, root = projectRoot) {
  const entry = registryEntry(config.slug, root)
  if (!entry) throw new VerifyError('sample', `reference sample "${config.slug}" is not registered in src/presentations/index.ts`)
  const base = path.join(root, 'src', 'presentations', entry.loadPath)
  if (!['.tsx', '.ts', '.jsx', '.js'].some((ext) => existsSync(base + ext))) {
    throw new VerifyError('sample', `"${config.slug}" is registered but its loader points at ${entry.loadPath}, which does not exist`)
  }
  return entry
}

/** Describe how a rendered step differs from the expected one, or null when it matches. */
export function compareStep(expected, observed) {
  for (const field of ['era', 'title', 'caption']) {
    if (observed[field] !== expected[field]) {
      return `${field} is ${JSON.stringify(observed[field])}, expected ${JSON.stringify(expected[field])}`
    }
  }
  return null
}

/** Describe a failed transition, or null when the public step index advanced as expected. */
export function checkTransition(from, expected, observed) {
  if (observed === expected) return null
  return `transition from step ${from} did not advance: expected index ${expected}, observed index ${observed}`
}

/** Collect console errors and uncaught page errors; attach before navigating. */
export function collectBrowserErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`uncaught page error: ${error.message ?? error}`))
  return errors
}

const readStep = (page) =>
  page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent ?? null
    const root = document.querySelector('[data-step-index]')
    return {
      index: root ? Number(root.getAttribute('data-step-index')) : null,
      mode: root?.getAttribute('data-presentation-mode') ?? null,
      era: text('[data-presentation-era]'),
      title: text('[data-presentation-title]'),
      caption: text('[data-presentation-caption]'),
      entities: document.querySelectorAll('[data-presentation-step] [data-presentation-entity]').length,
    }
  })

/** Newcomers enter 0.6s after a step starts and take 0.4s, so a step is only done rendering after ~1s. */
export const STEP_SETTLE_MS = 1200

const failStep = (index, message) => new VerifyError('render', `step ${index + 1} (index ${index}): ${message}`)

async function waitForIndex(page, expected) {
  try {
    await page.waitForFunction(
      (i) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(i),
      expected,
      { timeout: 3000 },
    )
  } catch {
    // reported by the caller from the observed index
  }
}

/** Step through every step of the sample; throws a VerifyError naming the phase and step. */
export async function renderSteps(page, origin, config, errors) {
  await page.goto(`${origin}/${config.slug}`, { waitUntil: 'load' })
  try {
    await page.waitForSelector('[data-step-count]', { timeout: 10000 })
  } catch {
    throw failStep(0, `${config.slug} did not render a presentation${errors.length ? `: ${errors[0]}` : ''}`)
  }
  const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
  if (count !== config.steps.length) {
    throw new VerifyError('sample', `expected ${config.steps.length} steps, the presentation reports ${count}`)
  }
  if ((await readStep(page)).mode !== 'browse') await page.keyboard.press('p')

  for (let i = 0; i < count; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      await waitForIndex(page, i)
    }
    await sleep(STEP_SETTLE_MS)
    const observed = await readStep(page)
    if (errors.length) throw failStep(i, errors[0])
    const transition = i === 0 ? (observed.index === 0 ? null : `first step has index ${observed.index}`) : checkTransition(i - 1, i, observed.index)
    if (transition) throw failStep(i, transition)
    if (observed.entities === 0) throw failStep(i, 'no scene entities rendered')
    const mismatch = compareStep(config.steps[i], observed)
    if (mismatch) throw new VerifyError('sample', `step ${i + 1} (index ${i}): ${mismatch}`)
  }
  return count
}

export async function verify({ root = projectRoot, log = console.log } = {}) {
  let preview
  let browser
  try {
    const build = await run('npm', ['run', 'build'], { cwd: root })
    if (build.code !== 0) throw new VerifyError('build', `npm run build failed\n${build.output.trim()}`)
    log('build: ok')

    const config = loadConfig(root)
    checkRegistry(config, root)

    preview = await startPreview(root)
    log(`preview: ${preview.origin} (pid ${preview.pid})`)
    try {
      browser = await launchChromium((await import('playwright')).chromium)
    } catch (error) {
      throw new VerifyError('render', `could not start Chromium: ${error.message}`)
    }
    const page = await browser.newPage()
    const errors = collectBrowserErrors(page)
    const count = await renderSteps(page, preview.origin, config, errors)
    log('sample: ok')
    log(`render: ok (${count} steps at ${preview.origin}/${config.slug})`)
    log('PASS')
    return 0
  } catch (error) {
    const phase = error instanceof VerifyError ? error.phase : 'render'
    log(`FAIL ${phase}: ${error.message}`)
    return 1
  } finally {
    await browser?.close().catch(() => {})
    await preview?.stop()
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = await verify()
}
