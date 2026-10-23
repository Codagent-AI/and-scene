#!/usr/bin/env node
// Build and browser-render verification for the reference sample. Run via `npm run verify`.
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { findFreePort, runBuild, startPreview, stopAllPreviews } from './lib/preview.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const SAMPLE_SLUG = 'how-to-make-a-presentation'
const SAMPLE_DIR = join(root, 'src', 'presentations', 'how-to-make-a-presentation')
const STEP_TIMEOUT_MS = 5_000

/** The nine normative steps, in order: [title, caption]. */
const EXPECTED_STEPS = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

/** A failed check. `phase` names the verification phase; `step` is the offending step index, when known. */
class VerifyFailure extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

const log = (line) => console.log(line)

async function checkSample() {
  const registry = await readFile(join(root, 'src', 'presentations', 'index.ts'), 'utf8')
  if (!registry.includes(`slug: '${SAMPLE_SLUG}'`) || !registry.includes(`import('./${SAMPLE_SLUG}/Talk')`)) {
    throw new VerifyFailure('sample', `sample "${SAMPLE_SLUG}" is not registered in src/presentations/index.ts`)
  }
  if (!existsSync(join(SAMPLE_DIR, 'Talk.tsx'))) {
    throw new VerifyFailure('sample', `sample entry ${SAMPLE_DIR}/Talk.tsx is missing`)
  }
  log('sample: registered and present')
}

/** Steps the production sample in a real browser and checks every step's text and transition. */
async function renderSample(baseUrl) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    let currentStep = 0
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
    })
    page.on('pageerror', (error) => errors.push(`uncaught error: ${error.message}`))

    const url = `${baseUrl}/${SAMPLE_SLUG}`
    if (!url.startsWith('http://127.0.0.1:')) throw new VerifyFailure('render', `non-IPv4 URL ${url}`)
    await page.goto(url)
    const root = page.locator('[data-presentation-root]')
    try {
      await root.waitFor({ timeout: STEP_TIMEOUT_MS })
    } catch {
      // The presentation never mounted: an initial render error is the likely cause, so report it.
      const reason = errors.length > 0 ? errors.join('; ') : 'the presentation root did not mount'
      throw new VerifyFailure('render', reason, 0)
    }
    const count = Number(await root.getAttribute('data-step-count'))
    if (count !== EXPECTED_STEPS.length) {
      throw new VerifyFailure('sample', `expected ${EXPECTED_STEPS.length} steps, found ${count}`)
    }

    for (let index = 0; index < count; index += 1) {
      currentStep = index
      const [title, caption] = EXPECTED_STEPS[index]
      const actualTitle = (await page.locator('[data-presentation-step-title]').textContent())?.trim()
      const actualCaption = (await page.locator('[data-presentation-caption]').textContent())?.trim()
      if (actualTitle !== title || actualCaption !== caption) {
        throw new VerifyFailure('sample', `step ${index} title/caption mismatch: "${actualTitle}" / "${actualCaption}"`, index)
      }
      if (errors.length > 0) throw new VerifyFailure('render', errors.join('; '), index)
      log(`render: step ${index} ok`)
      if (index < count - 1) {
        await page.keyboard.press('ArrowRight')
        await waitForIndex(root, index + 1, index, errors)
      }
    }
    if (errors.length > 0) throw new VerifyFailure('render', errors.join('; '), currentStep)
  } finally {
    await browser.close()
  }
}

/**
 * Waits for the public step index to reach `expected`. `from` is the step the transition
 * started on. A runtime error that appears while waiting is reported as a render failure
 * for the step being entered, because it is the render that broke.
 */
async function waitForIndex(root, expected, from, errors) {
  const deadline = Date.now() + STEP_TIMEOUT_MS
  for (;;) {
    if (errors.length > 0) throw new VerifyFailure('render', errors.join('; '), expected)
    const actual = Number(await root.getAttribute('data-step-index'))
    if (actual === expected) return
    if (Date.now() > deadline) {
      throw new VerifyFailure('transition', `step index stayed at ${actual}, expected ${expected}`, from)
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

async function main() {
  // Stops every preview this run started, including one still starting when a signal arrives.
  const cleanup = () => stopAllPreviews()
  const onSignal = (signal) => {
    cleanup().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143))
  }
  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)

  try {
    await runBuild(root, log).catch((error) => {
      throw new VerifyFailure('build', error.message)
    })
    await checkSample()
    const preview = await startPreview(root, await findFreePort())
    log(`render: preview ready at ${preview.url}`)
    await renderSample(preview.url)
  } catch (error) {
    const failure = error instanceof VerifyFailure ? error : new VerifyFailure('render', error.message)
    const where = failure.step === undefined ? '' : ` step ${failure.step}`
    console.error(`${failure.phase}:${where} ${failure.message}`)
    await cleanup()
    console.log(`verify: FAIL (${failure.phase})`)
    process.exit(1)
  }
  await cleanup()
  console.log('verify: PASS')
}

main()
