#!/usr/bin/env node
// Deterministic verification gate: whole-app build, then a production preview rendered in
// Chromium. Every step of the reference presentation is stepped through public hooks.
// Any failure exits non-zero and names the failed phase (and step, where one applies).
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { checkOutline, validateReference } from './lib/outline.mjs'
import { startPreview } from './lib/preview.mjs'
import { REFERENCE } from './reference.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// Worst case for one step: a 600 ms layout morph, then a 700 ms entry delay and a 450 ms fade. Each
// step is observed only after this settle, so no entry or late error is missed between steps.
const SETTLE_MS = 1800
const TRANSITION_TIMEOUT_MS = 5000

export class VerifyFailure extends Error {
  constructor(phase, message, step = null) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

function runBuild(root) {
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) {
    const tail = `${result.stdout}${result.stderr}`.trim().split('\n').slice(-12).join('\n')
    throw new VerifyFailure('build', `npm run build exited with status ${result.status}\n${tail}`)
  }
}

function checkRegistered(root, slug) {
  const registry = readFileSync(join(root, 'src/presentations/index.ts'), 'utf8')
  const pattern = new RegExp(`slug:\\s*['"]${slug}['"]`)
  if (!pattern.test(registry)) {
    throw new VerifyFailure('sample', `reference presentation "${slug}" is not registered in src/presentations/index.ts`)
  }
}

async function renderEveryStep(url, reference) {
  let browser
  const errors = []
  // Errors are attributed to the step the page was on when they were raised.
  let current = 0
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push({ step: current, text: message.text() })
    })
    page.on('pageerror', (error) => {
      errors.push({ step: current, text: error.message })
    })

    const errorAt = (step) => errors.find((error) => error.step === step)
    const showsStep = (expected) =>
      page.waitForFunction(
        (target) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(target),
        expected,
        { timeout: TRANSITION_TIMEOUT_MS },
      )

    try {
      await page.goto(`${url}/${reference.slug}`)
      await page.waitForSelector('[data-step-count]', { timeout: 15_000 })
    } catch (error) {
      // An exception raised before the chrome mounts is reported with its step, not as a timeout.
      const fault = errors.find((candidate) => candidate.step === 0)
      if (fault) throw new VerifyFailure('render', `step 1 raised a runtime error: ${fault.text}`, 0)
      throw new VerifyFailure('render', `the presentation chrome did not appear at /${reference.slug}: ${error.message}`)
    }
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    const observed = []
    for (let index = 0; index < count; index += 1) {
      current = index
      try {
        await showsStep(index)
      } catch {
        const fault = errorAt(index)
        if (fault) throw new VerifyFailure('render', `step ${index + 1} raised a runtime error: ${fault.text}`, index)
        throw new VerifyFailure('render', `the presentation did not show step ${index + 1}`, index)
      }
      await page.waitForTimeout(SETTLE_MS)
      observed.push(
        await page.evaluate(() => {
          const root = document.querySelector('[data-presentation-root]')
          return {
            index: Number(root.getAttribute('data-step-index')),
            era: root.getAttribute('data-presentation-era'),
            title: document.querySelector('[data-presentation-title]')?.textContent ?? null,
            caption: document.querySelector('[data-presentation-caption]')?.textContent ?? null,
          }
        }),
      )
      const fault = errorAt(index)
      if (fault) throw new VerifyFailure('render', `step ${index + 1} emitted a runtime error: ${fault.text}`, index)

      if (index < count - 1) {
        current = index + 1
        await page.keyboard.press('ArrowRight')
        try {
          await showsStep(index + 1)
        } catch {
          // A fault raised while entering the next step belongs to that step, not to this one.
          const fault = errorAt(index + 1)
          if (fault) throw new VerifyFailure('render', `step ${index + 2} raised a runtime error: ${fault.text}`, index + 1)
          throw new VerifyFailure('transition', `ArrowRight did not advance from step ${index + 1}`, index)
        }
      }
    }
    if (errors.length > 0) {
      throw new VerifyFailure('render', `runtime error: ${errors[0].text}`, errors[0].step)
    }
    return { count, observed }
  } finally {
    if (browser) await browser.close()
  }
}

/** Runs the whole gate. Resolves with a summary, or throws VerifyFailure naming the failed phase. */
export async function verify({ root = ROOT, log = console.log } = {}) {
  const reference = REFERENCE
  const shapeProblems = validateReference(reference)
  if (shapeProblems.length > 0) throw new VerifyFailure('sample', shapeProblems[0])

  log('phase build: npm run build')
  runBuild(root)
  log('phase build: ok')

  log(`phase sample: checking the reference presentation "${reference.slug}"`)
  checkRegistered(root, reference.slug)
  log('phase sample: registered')

  let preview
  try {
    log('phase preview: vite preview on 127.0.0.1')
    try {
      preview = await startPreview(root)
    } catch (error) {
      throw new VerifyFailure('preview', error.message)
    }
    log(`phase preview: serving ${preview.url}`)
    log('phase render: stepping through every step in Chromium')
    const { count, observed } = await renderEveryStep(preview.url, reference)
    const problems = checkOutline(observed, reference.steps)
    log(`phase render: ${count} steps rendered without runtime or console errors`)
    if (problems.length > 0) throw new VerifyFailure('outline', problems[0].message, problems[0].step)
    log('phase outline: every step matches the reference outline')
    return { steps: count, url: preview.url }
  } finally {
    if (preview) await preview.stop()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  verify()
    .then((summary) => {
      console.log(`VERIFY PASSED: ${summary.steps} steps of /${REFERENCE.slug} at ${summary.url}`)
    })
    .catch((error) => {
      const where = error instanceof VerifyFailure ? error : new VerifyFailure('unexpected', error.stack ?? String(error))
      const stepText = where.step === null || where.step === undefined ? '' : ` (step ${where.step + 1})`
      console.error(`VERIFY FAILED [${where.phase}]${stepText}: ${where.message}`)
      process.exitCode = 1
    })
}
