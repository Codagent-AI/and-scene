// Build + browser-render verification: `npm run verify`.
// Phases: build -> registry -> preview -> render. Any failure exits non-zero and names the phase
// (and the step, for browser faults). Preview and browser always use the IPv4 loopback address.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { HOST, freePort, run, startPreview } from './preview.mjs'

export const STEP_TIMEOUT_MS = 4000

/** Normative outlines (titles and captions, in order) keyed by presentation slug. */
export const OUTLINES = {
  'how-to-make-a-presentation': [
    ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
    ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
    ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
    ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
    ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
    ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
    ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
    ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
    ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
  ].map(([era, title, caption]) => ({ era, title, caption })),
}

export class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

/** Compare one observed step against the normative outline; returns a message or null. */
export function outlineMismatch(slug, index, observed) {
  const expected = OUTLINES[slug]?.[index]
  if (!expected) return `${slug} has no step ${index + 1} in its outline`
  for (const key of ['title', 'caption']) {
    if (observed[key] !== expected[key]) {
      return `step ${index + 1} ${key} is ${JSON.stringify(observed[key])}, expected ${JSON.stringify(expected[key])}`
    }
  }
  return null
}

async function build(root) {
  const { code, out } = await run('npm', ['run', 'build'], root)
  if (code !== 0) throw new VerifyError('build', `npm run build failed:\n${out.trim().split('\n').slice(-15).join('\n')}`)
}

async function loadRegistry(root) {
  const file = path.join(root, 'src/presentations/index.ts')
  if (!existsSync(file)) throw new VerifyError('registry', 'src/presentations/index.ts is missing')
  let registry
  try {
    registry = (await import(pathToFileURL(file).href)).presentations
  } catch (e) {
    throw new VerifyError('registry', `could not read the presentation registry: ${e.message}`)
  }
  if (!Array.isArray(registry)) throw new VerifyError('registry', 'registry does not export a presentations array')
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  for (const slug of pkg.andScene?.requiredPresentations ?? []) {
    if (!registry.some((e) => e.slug === slug)) throw new VerifyError('registry', `required presentation "${slug}" is not registered`)
  }
  if (registry.length === 0) throw new VerifyError('registry', 'no presentations are registered')
  return registry
}

async function readStep(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-presentation-root]')
    const text = (sel) => document.querySelector(sel)?.textContent ?? null
    return {
      index: Number(root.getAttribute('data-step-index')),
      title: text('[data-presentation-title]'),
      caption: text('[data-presentation-caption]'),
    }
  })
}

async function renderPresentation(browser, port, entry) {
  const slug = entry.slug
  const page = await browser.newPage()
  let step = 0
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`uncaught exception: ${e.message}`))
  const check = () => {
    if (errors.length) throw new VerifyError('render', `${slug}: ${errors[0]}`, step)
  }
  try {
    await page.goto(`http://${HOST}:${port}/${slug}`, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-presentation-root]', { timeout: STEP_TIMEOUT_MS * 2 })
    } catch {
      check()
      throw new VerifyError('render', `${slug}: presentation chrome never rendered`, 0)
    }
    if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== 'browse') {
      await page.keyboard.press('p')
    }
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    const outline = OUTLINES[slug]
    if (outline && count !== outline.length) {
      throw new VerifyError('outline', `${slug}: expected ${outline.length} steps, found ${count}`)
    }
    for (step = 0; step < count; step++) {
      await page.waitForTimeout(150)
      check()
      const seen = await readStep(page)
      if (seen.index !== step) throw new VerifyError('render', `${slug}: step index is ${seen.index}, expected ${step}`, step)
      const mismatch = outline && outlineMismatch(slug, step, seen)
      if (mismatch) throw new VerifyError('outline', `${slug}: ${mismatch}`, step)
      await page.keyboard.press('ArrowRight')
      if (step < count - 1) {
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-presentation-root]').getAttribute('data-step-index') === String(n),
            step + 1,
            { timeout: STEP_TIMEOUT_MS },
          )
        } catch {
          check()
          throw new VerifyError('transition', `${slug}: ArrowRight did not advance past step ${step}`, step)
        }
      }
    }
    step = count - 1
    await page.waitForTimeout(150)
    check()
    if ((await readStep(page)).index !== count - 1) {
      throw new VerifyError('transition', `${slug}: navigation did not clamp at the last step`, step)
    }
    return count
  } finally {
    await page.close()
  }
}

export async function verify(root, { skipBuild = false, slug } = {}) {
  if (!skipBuild) {
    console.log('[verify] build: npm run build')
    await build(root)
  }
  console.log('[verify] registry: reading src/presentations/index.ts')
  let entries = await loadRegistry(root)
  if (slug) {
    entries = entries.filter((e) => e.slug === slug)
    if (!entries.length) throw new VerifyError('registry', `"${slug}" is not registered`)
  }
  const port = await freePort()
  console.log(`[verify] preview: vite preview on http://${HOST}:${port}`)
  const preview = await startPreview(root, port).catch((e) => {
    throw new VerifyError('preview', e.message)
  })
  let browser
  let steps = 0
  try {
    const { chromium } = await import('playwright')
    browser = await chromium.launch()
    for (const entry of entries) {
      console.log(`[verify] render: ${entry.slug}`)
      steps += await renderPresentation(browser, port, entry)
    }
  } finally {
    await browser?.close()
    await preview.stop()
  }
  return { presentations: entries.length, steps }
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const args = process.argv.slice(2)
  const slugAt = args.indexOf('--slug')
  try {
    const result = await verify(root, {
      skipBuild: args.includes('--skip-build'),
      slug: slugAt >= 0 ? args[slugAt + 1] : undefined,
    })
    console.log(`PASS verify: ${result.presentations} presentation(s), ${result.steps} step(s) rendered without errors`)
  } catch (e) {
    const phase = e instanceof VerifyError ? e.phase : 'internal'
    const step = e instanceof VerifyError && e.step !== undefined ? ` (step index ${e.step})` : ''
    console.error(`FAIL verify [${phase}]${step}: ${e.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
