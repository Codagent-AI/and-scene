// Production verification gate: build, sample outline, then every step rendered in Chromium
// against `vite preview` on 127.0.0.1. Exits non-zero naming the failed phase (and step).
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { previewUrl, runBuild, startPreview } from './lib/preview.mjs'

const SAMPLE_SLUG = 'how-to-make-a-presentation'
const STEP_TIMEOUT_MS = 4000
const SETTLE_MS = 300

// Normative outline, transcribed from the presentation-verification spec.
export const CANONICAL_SAMPLE = {
  slug: SAMPLE_SLUG,
  title: 'How to Use This Skill to Make a Presentation',
  steps: [
    { era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.' },
    { era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.' },
    { era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.' },
    { era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.' },
    { era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.' },
    { era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.' },
    { era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.' },
    { era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.' },
    { era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.' },
  ],
}

export class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

export function formatFailure(err) {
  const phase = err instanceof VerifyError ? err.phase : 'verify'
  const step = err instanceof VerifyError && err.step !== undefined ? ` step=${err.step}` : ''
  return `VERIFY FAIL phase=${phase}${step}: ${err.message}`
}

export function exitCodeFor(err) {
  return err ? 1 : 0
}

export function parseArgs(argv) {
  const args = { route: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--route') args.route = argv[++i]
  }
  return args
}

/** Problems with how the registry source declares a presentation slug (and title/loader when given). */
export function checkRegistration(indexSource, { slug, title }) {
  const problems = []
  const entry = new RegExp(`\\{[^{}]*slug:\\s*(['"])${slug}\\1[^{}]*\\}`, 's').exec(indexSource)
  if (!entry) return [`presentation "${slug}" is not registered in presentations/index.ts`]
  if (title !== undefined && !entry[0].includes(JSON.stringify(title).slice(1, -1)) && !entry[0].includes(title)) {
    problems.push(`registered title for "${slug}" does not match "${title}"`)
  }
  if (!/load:\s*\(\)\s*=>\s*import\(/.test(entry[0])) problems.push(`registry entry "${slug}" has no lazy load()`)
  return problems
}

/** Problems comparing the sample's outline data (the data its steps are built from) with the canonical steps. */
export function checkOutline(outline, canonical = CANONICAL_SAMPLE) {
  const problems = []
  if (!Array.isArray(outline)) return ['sample outline is missing']
  if (outline.length !== canonical.steps.length) {
    problems.push(`expected ${canonical.steps.length} steps, found ${outline.length}`)
  }
  canonical.steps.forEach((want, i) => {
    const got = outline[i]
    if (!got) return
    for (const key of ['era', 'title', 'caption']) {
      if (got[key] !== want[key]) problems.push(`step ${i + 1} ${key}: expected ${JSON.stringify(want[key])}, found ${JSON.stringify(got[key])}`)
    }
  })
  return problems
}

/** Returns an error message when the observed step index is not the expected one. */
export function indexProblem(expected, actual) {
  if (actual === expected) return null
  if (actual === null || Number.isNaN(actual)) return `step index hook missing (expected ${expected})`
  return `step index expected ${expected} but was ${actual}`
}

async function readRegistry(root) {
  try {
    return await readFile(path.join(root, 'src/presentations/index.ts'), 'utf8')
  } catch {
    throw new VerifyError('sample', 'src/presentations/index.ts is missing')
  }
}

async function checkSample(root, route) {
  const source = await readRegistry(root)
  if (route) {
    const problems = checkRegistration(source, { slug: route })
    if (problems.length) throw new VerifyError('sample', problems.join('; '))
    return
  }
  const problems = checkRegistration(source, CANONICAL_SAMPLE)
  if (!problems.length) {
    const file = path.join(root, 'src/presentations', SAMPLE_SLUG, 'outline.ts')
    try {
      const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)
      problems.push(...checkOutline(mod.OUTLINE))
    } catch (err) {
      problems.push(`cannot load sample outline: ${err.message}`)
    }
  }
  if (problems.length) throw new VerifyError('sample', problems.join('; '))
}

async function waitForIndex(page, expected) {
  const deadline = Date.now() + STEP_TIMEOUT_MS
  let actual = null
  while (Date.now() < deadline) {
    const raw = await page.getAttribute('[data-step-index]', 'data-step-index').catch(() => null)
    actual = raw === null ? null : Number(raw)
    if (actual === expected) return
    await page.waitForTimeout(50)
  }
  return indexProblem(expected, actual)
}

async function renderSample(root, slug, canonical) {
  const preview = await startPreview(root)
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage()
    let current = 0
    const errors = []
    page.on('console', (msg) => msg.type() === 'error' && errors.push({ step: current, text: msg.text() }))
    page.on('pageerror', (err) => errors.push({ step: current, text: String(err) }))
    const check = () => {
      if (errors.length) throw new VerifyError('render', `browser error: ${errors[0].text}`, errors[0].step)
    }

    await page.goto(previewUrl(preview.port, `/${slug}`))
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 10_000 })
    } catch {
      check()
      throw new VerifyError('render', `presentation "${slug}" did not render a step-count hook`, 0)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    if (!(count > 0)) throw new VerifyError('render', 'step count hook is not a positive number', 0)
    if (canonical && count !== canonical.steps.length) {
      throw new VerifyError('render', `expected ${canonical.steps.length} steps, hook reports ${count}`, 0)
    }

    for (let i = 0; i < count; i++) {
      current = i
      const problem = await waitForIndex(page, i)
      if (problem) {
        check()
        throw new VerifyError('render', i === 0 ? problem : `transition did not advance: ${problem}`, i)
      }
      if (canonical) {
        const want = canonical.steps[i]
        const title = await page.textContent('[data-presentation-title]').catch(() => null)
        const caption = await page.textContent('[data-presentation-caption]').catch(() => null)
        if (title !== want.title || caption !== want.caption) {
          throw new VerifyError('render', `step ${i + 1} shows title ${JSON.stringify(title)} / caption ${JSON.stringify(caption)}, not the normative text`, i)
        }
      }
      await page.waitForTimeout(SETTLE_MS)
      check()
      console.log(`[verify] render step ${i + 1}/${count} ok`)
      if (i < count - 1) await page.keyboard.press('ArrowRight')
    }
    return count
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

export async function verify({ root = process.cwd(), route = null } = {}) {
  const build = await runBuild(root)
  if (build.code !== 0) throw new VerifyError('build', `npm run build failed (exit ${build.code})\n${build.output.trim()}`)
  console.log('[verify] build ok')

  await checkSample(root, route)
  console.log(`[verify] sample ${route ?? SAMPLE_SLUG} ok`)

  const count = await renderSample(root, route ?? SAMPLE_SLUG, route ? null : CANONICAL_SAMPLE)
  console.log(`VERIFY PASS: build, sample, render (${count} steps) on 127.0.0.1`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { route } = parseArgs(process.argv.slice(2))
  try {
    await verify({ route })
  } catch (err) {
    console.error(formatFailure(err))
    process.exitCode = exitCodeFor(err)
  }
}
