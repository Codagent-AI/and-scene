// `npm run verify`: build the whole app, then render every registered
// presentation in Chromium against a production preview on 127.0.0.1.
// Pass --reference-sample to also require the committed reference sample.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { ensureChromium, launchOptions, loopbackUrl, startPreview, stopPreview } from './lib/preview.mjs'

export const SAMPLE_SLUG = 'how-to-make-a-presentation'
export const SAMPLE_TITLE = 'How to Use This Skill to Make a Presentation'

/** Normative outline of the reference sample (specs: presentation-verification). */
export const NORMATIVE_OUTLINE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
].map(([era, title, caption]) => ({ era, title, caption }))

export class VerifyFailure extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

/** Entries of the explicit registry source: `{ slug, title }` pairs in order. */
export function parseRegistry(source) {
  const entries = []
  const pattern = /slug:\s*'([^']+)'\s*,\s*title:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g
  for (const m of source.matchAll(pattern)) entries.push({ slug: m[1], title: (m[2] ?? m[3]).replace(/\\(.)/g, '$1') })
  return entries
}

/** Throws VerifyFailure('sample') unless the registry lists the reference sample. */
export function checkSampleRegistered(registrySource) {
  const entry = parseRegistry(registrySource).find((e) => e.slug === SAMPLE_SLUG)
  if (!entry) throw new VerifyFailure('sample', `reference sample "${SAMPLE_SLUG}" is not registered in src/presentations/index.ts`)
  if (entry.title !== SAMPLE_TITLE) throw new VerifyFailure('sample', `reference sample is registered as "${entry.title}", expected "${SAMPLE_TITLE}"`)
}

/** Compare observed per-step narration with the normative outline, in order. */
export function validateOutline(observed, expected = NORMATIVE_OUTLINE) {
  if (observed.length !== expected.length) {
    throw new VerifyFailure('sample', `reference sample has ${observed.length} steps, expected ${expected.length}`)
  }
  expected.forEach((want, i) => {
    const got = observed[i]
    for (const key of ['era', 'title', 'caption']) {
      if (got[key] !== want[key]) {
        throw new VerifyFailure('sample', `step ${i + 1} ${key} is ${JSON.stringify(got[key])}, expected ${JSON.stringify(want[key])}`, i)
      }
    }
  })
}

/** Records console errors and uncaught page errors against the step being viewed. */
export function createErrorCollector(page, getStep) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ step: getStep(), kind: 'console.error', text: msg.text() })
  })
  page.on('pageerror', (err) => errors.push({ step: getStep(), kind: 'pageerror', text: String(err?.message ?? err) }))
  return {
    /** Throws VerifyFailure('render') for the first recorded error, if any. */
    assertClean() {
      const first = errors[0]
      if (first) throw new VerifyFailure('render', `${first.kind} while on step ${first.step}: ${first.text}`, first.step)
    },
  }
}

function run(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ code, output }))
  })
}

async function readStep(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-step-index]')
    const text = (sel) => document.querySelector(sel)?.textContent ?? null
    return {
      index: root ? Number(root.getAttribute('data-step-index')) : null,
      count: root ? Number(root.getAttribute('data-step-count')) : null,
      title: text('[data-presentation-step-title]'),
      caption: text('[data-presentation-step-caption]'),
      mode: root?.getAttribute('data-presentation-mode') ?? null,
      id: root?.getAttribute('data-presentation-step-id') ?? null,
      era: root?.getAttribute('data-presentation-step-era') ?? null,
    }
  })
}

async function waitForIndex(page, expected, timeoutMs) {
  try {
    await page.waitForFunction(
      (n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n),
      expected,
      { timeout: timeoutMs },
    )
    return true
  } catch {
    return false
  }
}

/** Step through one presentation; returns its observed narration per step. */
async function renderPresentation(browser, baseUrl, slug, { stepTimeoutMs, isSample }) {
  const page = await browser.newPage()
  let currentStep = 0
  const collector = createErrorCollector(page, () => currentStep)
  try {
    await page.goto(loopbackUrl(new URL(baseUrl).port, `/${slug}`), { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-index]', { timeout: stepTimeoutMs })
    } catch {
      collector.assertClean()
      throw new VerifyFailure('render', `"${slug}" did not render a presentation (no [data-step-index] hook)`, 0)
    }
    const first = await readStep(page)
    if (!first.count) throw new VerifyFailure('render', `"${slug}" reports no steps`, 0)
    if (isSample && first.mode !== 'browse') {
      await page.keyboard.press('p')
      await waitForIndex(page, 0, stepTimeoutMs)
    }
    const observed = []
    for (let i = 0; i < first.count; i++) {
      currentStep = i
      const now = await readStep(page)
      if (now.index !== i) throw new VerifyFailure('transition', `expected step index ${i} but found ${now.index}`, i)
      observed.push({ id: now.id, era: now.era, title: now.title, caption: now.caption })
      if (i < first.count - 1) {
        await page.keyboard.press('ArrowRight')
        if (!(await waitForIndex(page, i + 1, stepTimeoutMs))) {
          collector.assertClean()
          throw new VerifyFailure('transition', `ArrowRight on step ${i} did not advance data-step-index to ${i + 1} within ${stepTimeoutMs}ms`, i)
        }
      }
      collector.assertClean()
    }
    await page.waitForTimeout(250)
    collector.assertClean()
    return observed
  } finally {
    await page.close()
  }
}

export async function verify({ root, referenceSample, stepTimeoutMs = Number(process.env.VERIFY_STEP_TIMEOUT ?? 5000), log = console.log }) {
  log('[verify] phase build: npm run build')
  const build = await run('npm', ['run', 'build'], root)
  if (build.code !== 0) {
    log(build.output)
    throw new VerifyFailure('build', 'npm run build failed (exit ' + build.code + ')')
  }
  log('[verify] phase build: ok')

  const registrySource = readFileSync(path.join(root, 'src/presentations/index.ts'), 'utf8')
  const slugs = parseRegistry(registrySource).map((e) => e.slug)
  if (referenceSample) checkSampleRegistered(registrySource)
  if (slugs.length === 0) throw new VerifyFailure('sample', 'no presentations are registered in src/presentations/index.ts')
  log(`[verify] phase registry: ok (${slugs.join(', ')})`)

  let browser
  let preview
  try {
    const chromium = await ensureChromium(root, log).catch((e) => {
      throw new VerifyFailure('provision', e.message)
    })
    preview = await startPreview(root, { log }).catch((e) => {
      throw new VerifyFailure('preview', e.message)
    })
    log(`[verify] preview ${preview.baseUrl} (host 127.0.0.1)`)
    browser = await chromium.launch(launchOptions())
    for (const slug of slugs) {
      const isSample = referenceSample && slug === SAMPLE_SLUG
      log(`[verify] phase render: ${loopbackUrl(preview.port, '/' + slug)}`)
      const observed = await renderPresentation(browser, preview.baseUrl, slug, { stepTimeoutMs, isSample })
      if (isSample) {
        const registry = parseRegistry(registrySource).find((e) => e.slug === SAMPLE_SLUG)
        validateOutline(observed)
        log(`[verify] phase sample: ok (${registry.title}, ${observed.length} steps in order)`)
      }
      log(`[verify] phase render: ok "${slug}" ${observed.length} steps`)
    }
  } finally {
    await browser?.close().catch(() => {})
    if (preview) await stopPreview(preview)
  }
}

async function main() {
  const referenceSample = process.argv.includes('--reference-sample')
  try {
    await verify({ root: process.cwd(), referenceSample })
  } catch (error) {
    const phase = error instanceof VerifyFailure ? error.phase : 'unexpected'
    const step = error instanceof VerifyFailure && error.step !== undefined ? ` step=${error.step}` : ''
    console.error(`VERIFY FAIL phase=${phase}${step}: ${error.message}`)
    process.exit(1)
  }
  console.log('VERIFY PASS')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
