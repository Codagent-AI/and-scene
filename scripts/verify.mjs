#!/usr/bin/env node
// Deterministic production gate: build -> sample -> render -> report.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { HOST, launchChromium, projectRoot, runCommand, startPreview } from './lib/preview.mjs'

// ---- Project-specific expectations (edit these when copying into a scaffold) ----
export const SAMPLE_SLUG = 'how-to-make-a-presentation'
export const REGISTRY_FILE = 'src/presentations/index.ts'
export const OUTLINE_FILE = `src/presentations/${SAMPLE_SLUG}/outline.ts`
export const EXPECTED_STEPS = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
].map(([title, caption]) => ({ title, caption }))
// Per-step settle before checking errors / pressing the next key (ms).
const STEP_SETTLE_MS = Number(process.env.VERIFY_STEP_SETTLE_MS ?? 700)
const TRANSITION_TIMEOUT_MS = 3000

export class PhaseError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

/** Assert titles and captions occur in `source` in the expected order. */
export function assertOutlineOrder(source, expected = EXPECTED_STEPS) {
  let cursor = 0
  expected.forEach(({ title, caption }, i) => {
    for (const [kind, text] of [['title', title], ['caption', caption]]) {
      const at = source.indexOf(text, cursor)
      if (at === -1) {
        const anywhere = source.includes(text)
        throw new PhaseError(
          'sample',
          `step ${i + 1} ${kind} ${JSON.stringify(text)} ${anywhere ? 'is out of order' : 'is missing'} in the sample outline`,
          i,
        )
      }
      cursor = at + text.length
    }
  })
}

export function formatReport(results, failure) {
  const lines = results.map((r) => `  ${r.ok ? 'PASS' : 'FAIL'}  ${r.phase}${r.detail ? ` — ${r.detail}` : ''}`)
  if (failure) {
    const where = failure.step === undefined ? '' : ` at step index ${failure.step}`
    lines.push('', `VERIFY FAIL: phase "${failure.phase}"${where}: ${failure.message}`)
  } else {
    lines.push('', 'VERIFY PASS: build, sample, and render checks all passed')
  }
  return lines.join('\n')
}

async function buildPhase(root) {
  const { code, output } = await runCommand('npm', ['run', 'build'], { cwd: root })
  if (code !== 0) throw new PhaseError('build', `npm run build failed (exit ${code})\n${output.trim()}`)
  return 'npm run build succeeded'
}

function samplePhase(root) {
  const registryPath = path.join(root, REGISTRY_FILE)
  if (!fs.existsSync(registryPath)) throw new PhaseError('sample', `registry ${REGISTRY_FILE} not found`)
  const registry = fs.readFileSync(registryPath, 'utf8')
  if (!new RegExp(`slug:\\s*['"\`]${SAMPLE_SLUG}['"\`]`).test(registry)) {
    throw new PhaseError('sample', `sample "${SAMPLE_SLUG}" is not registered in ${REGISTRY_FILE}`)
  }
  const outlinePath = path.join(root, OUTLINE_FILE)
  if (!fs.existsSync(outlinePath)) throw new PhaseError('sample', `sample outline ${OUTLINE_FILE} not found`)
  assertOutlineOrder(fs.readFileSync(outlinePath, 'utf8'))
  return `${SAMPLE_SLUG} registered; ${EXPECTED_STEPS.length} titles/captions in order`
}

async function renderPhase(root) {
  let preview
  let browser
  let current = 0
  const fail = (message, step = current) => new PhaseError('render', message, step)
  try {
    preview = await startPreview(root)
    browser = await launchChromium()
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push({ step: current, text: `console.error: ${m.text()}` }))
    page.on('pageerror', (e) => errors.push({ step: current, text: `pageerror: ${e.message}` }))
    const checkErrors = () => {
      if (errors.length) throw fail(errors[0].text, errors[0].step)
    }

    const url = `http://${HOST}:${preview.port}/${SAMPLE_SLUG}`
    await page.goto(url)
    try {
      await page.waitForSelector('[data-presentation-root]', { timeout: 10_000 })
    } catch {
      checkErrors()
      throw fail(`sample route ${url} did not render a presentation`, 0)
    }
    const root$ = page.locator('[data-presentation-root]')
    const count = Number(await root$.getAttribute('data-step-count'))
    if (count !== EXPECTED_STEPS.length) {
      throw fail(`data-step-count is ${count}, expected ${EXPECTED_STEPS.length}`, 0)
    }

    for (let i = 0; i < count; i++) {
      current = i
      const idx = await root$.getAttribute('data-step-index').catch(() => null)
      if (idx === null) {
        checkErrors()
        throw fail(`presentation root disappeared while rendering step ${i}`)
      }
      if (Number(idx) !== i) throw fail(`expected data-step-index ${i} but found ${idx}`)
      const title = await page.locator('[data-presentation-step-title]').textContent()
      const caption = await page.locator('[data-presentation-caption]').textContent()
      if (title !== EXPECTED_STEPS[i].title) throw fail(`title ${JSON.stringify(title)} does not match ${JSON.stringify(EXPECTED_STEPS[i].title)}`)
      if (caption !== EXPECTED_STEPS[i].caption) throw fail(`caption ${JSON.stringify(caption)} does not match the outline`)
      await page.waitForTimeout(STEP_SETTLE_MS)
      checkErrors()
      if (i === count - 1) break
      current = i + 1 // errors raised while rendering the next step belong to it
      await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction(
          (next) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(next),
          i + 1,
          { timeout: TRANSITION_TIMEOUT_MS },
        )
      } catch {
        checkErrors()
        throw fail(`ArrowRight did not advance data-step-index from ${i} to ${i + 1}`, i)
      }
    }
    return `${count} steps rendered at http://${HOST}:${preview.port} with no console or page errors`
  } finally {
    await browser?.close().catch(() => {})
    await preview?.stop()
  }
}

export async function runVerify(root = projectRoot()) {
  const results = []
  const phases = [
    ['build', buildPhase],
    ['sample', samplePhase],
    ['render', renderPhase],
  ]
  for (const [name, fn] of phases) {
    try {
      const detail = await fn(root)
      results.push({ phase: name, ok: true, detail })
    } catch (err) {
      const failure =
        err instanceof PhaseError ? err : new PhaseError(name, String(err?.message ?? err))
      results.push({ phase: name, ok: false })
      return { ok: false, report: formatReport(results, failure), failure }
    }
  }
  return { ok: true, report: formatReport(results) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ok, report } = await runVerify()
  console[ok ? 'log' : 'error'](report)
  process.exit(ok ? 0 : 1)
}
