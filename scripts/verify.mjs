#!/usr/bin/env node
// Build the whole app, check the reference sample's outline, then render every
// step of the sample in Chromium against a production preview. Exits non-zero on
// the first failing phase and always stops the preview server.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { startPreview } from './lib/browser.mjs'
import { checkOutline } from './lib/outline-check.mjs'
import { NORMATIVE_OUTLINE, SAMPLE_SLUG } from './lib/sample-outline.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const STEP_TIMEOUT_MS = 5_000
const SETTLE_MS = 150

class PhaseFailure extends Error {
  constructor(phase, detail, step) {
    super(detail)
    this.phase = phase
    this.step = step
  }
}

function runBuild() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(npm, ['run', 'build'], { cwd: ROOT, encoding: 'utf8' })
  if (result.status !== 0) {
    throw new PhaseFailure('build', `npm run build exited ${result.status}\n${result.stdout}${result.stderr}`.trim())
  }
}

/** Reads the registry and the sample's step data through Vite, without a browser. */
async function checkSampleOutline() {
  const vite = await createServer({
    root: ROOT,
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  try {
    const { PRESENTATIONS } = await vite.ssrLoadModule('/src/presentations/index.ts')
    const { SAMPLE_STEPS } = await vite.ssrLoadModule('/src/presentations/how-to-make-a-presentation/steps.ts')
    const problems = checkOutline({
      registry: PRESENTATIONS,
      slug: SAMPLE_SLUG,
      steps: SAMPLE_STEPS,
      expected: NORMATIVE_OUTLINE,
    })
    if (problems.length > 0) {
      const [first] = problems
      throw new PhaseFailure('sample', problems.map((problem) => problem.message).join('\n'), first.step)
    }
  } finally {
    await vite.close()
  }
}

async function readChrome(page) {
  return page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? null
    return {
      index: Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')),
      count: Number(document.querySelector('[data-step-count]')?.getAttribute('data-step-count')),
      title: text('[data-presentation-step-title]'),
      caption: text('[data-presentation-caption]'),
      entities: document.querySelectorAll('[data-presentation-scene] [data-presentation-entity]').length,
    }
  })
}

/** Steps through the sample in a real browser, failing on the first problem. */
async function renderSample() {
  const preview = await startPreview(ROOT)
  console.log(`preview ${preview.url}`)
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(`uncaught: ${error.message}`))

    await page.goto(`${preview.url}/${SAMPLE_SLUG}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS * 3 })
    const first = await readChrome(page)
    if (first.count !== NORMATIVE_OUTLINE.length) {
      throw new PhaseFailure('sample', `rendered ${first.count} steps, expected ${NORMATIVE_OUTLINE.length}`)
    }

    for (let index = 0; index < first.count; index += 1) {
      await page.waitForTimeout(SETTLE_MS)
      const shown = await readChrome(page)
      const expected = NORMATIVE_OUTLINE[index]
      if (shown.index !== index) {
        throw new PhaseFailure('transition', `expected step index ${index}, page shows ${shown.index}`, index)
      }
      if (shown.title !== expected.title) {
        throw new PhaseFailure('render', `title ${JSON.stringify(shown.title)} != ${JSON.stringify(expected.title)}`, index)
      }
      if (shown.caption !== expected.caption) {
        throw new PhaseFailure('render', `caption ${JSON.stringify(shown.caption)} != ${JSON.stringify(expected.caption)}`, index)
      }
      if (shown.entities === 0) {
        throw new PhaseFailure('render', 'scene rendered no entities', index)
      }
      if (errors.length > 0) {
        throw new PhaseFailure('render', errors.join('\n'), index)
      }
      if (index < first.count - 1) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (target) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(target),
            index + 1,
            { timeout: STEP_TIMEOUT_MS },
          )
        } catch {
          throw new PhaseFailure('transition', `ArrowRight did not advance past step ${index}`, index)
        }
      }
    }
    await page.waitForTimeout(SETTLE_MS)
    if (errors.length > 0) {
      throw new PhaseFailure('render', errors.join('\n'), first.count - 1)
    }
    return { steps: first.count, preview: preview.url }
  } finally {
    await browser.close()
    await preview.stop()
  }
}

async function main() {
  let phase = 'build'
  try {
    runBuild()
    phase = 'sample'
    await checkSampleOutline()
    phase = 'render'
    const result = await renderSample()
    console.log(`PASS verify: build, sample outline, and ${result.steps} rendered steps on ${result.preview}`)
  } catch (error) {
    const failure = error instanceof PhaseFailure ? error : new PhaseFailure(phase, error.stack ?? String(error))
    console.error(`FAIL ${failure.phase}`)
    if (failure.step !== undefined) console.error(`step ${failure.step}`)
    console.error(failure.message)
    process.exitCode = 1
  }
}

await main()
