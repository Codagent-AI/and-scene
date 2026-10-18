import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { startPreview } from './lib/preview.mjs'

/** Normative outline of the committed reference sample (era, presenter title, browse caption). */
export const SAMPLE_SLUG = 'how-to-make-a-presentation'
export const OUTLINE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  [
    'the ask',
    'The skill interviews you',
    'One question at a time: the topic, the look, then each beat of the story.',
  ],
  [
    'the gathering',
    'Answers become steps',
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  ],
  [
    'the gathering',
    'The deck grows',
    'Same shapes, new beats. Every answer extends the story without redrawing it.',
  ],
  [
    'the gathering',
    'You set the depth',
    'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  ],
  [
    'the build',
    'It assembles the scene',
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  ],
  [
    'the build',
    'It checks its own work',
    'Before saying done, it builds and renders every step — and fixes what breaks.',
  ],
  [
    'the loop',
    'Changed your mind? Loop it.',
    'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  ],
  [
    'the reveal',
    "You're looking at one",
    'This presentation was built exactly this way. Thanks for watching.',
  ],
].map(([era, title, caption]) => ({ era, title, caption }))

const SETTLE_MS = 800
const STEP_TIMEOUT_MS = 3000

export class Failure extends Error {
  constructor(phase, message, { step, index } = {}) {
    super(message)
    this.phase = phase
    this.step = step
    this.index = index
  }
}

/** `FAIL [phase] step N (index I): message` — the step part only when a step is known. */
export function formatFailure({ phase, message, step, index }) {
  const where = step === undefined ? '' : ` step ${step} (index ${index})`
  return `FAIL [${phase}]${where}: ${message}`
}

export function isRegistered(registrySource, slug) {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`slug:\\s*['"\`]${escaped}['"\`]`).test(registrySource)
}

/** First mismatch between the expected and the rendered step, or null. */
export function compareStep(expected, actual) {
  for (const key of ['era', 'title', 'caption']) {
    if (expected[key] !== actual[key]) {
      return `${key} mismatch: expected ${JSON.stringify(expected[key])}, rendered ${JSON.stringify(actual[key])}`
    }
  }
  return null
}

export function loadConfig(root) {
  const file = path.join(root, 'verify.config.json')
  const config = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  return { slug: config.slug ?? SAMPLE_SLUG, outline: config.outline ?? config.slug === undefined }
}

function runBuild(root) {
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) {
    const tail = `${result.stdout}${result.stderr}`.trim().split('\n').slice(-25).join('\n')
    throw new Failure('build', `npm run build exited with ${result.status}\n${tail}`)
  }
}

function checkRegistry(root, slug) {
  const file = path.join(root, 'src', 'presentations', 'index.ts')
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  if (!isRegistered(source, slug)) {
    throw new Failure('sample', `presentation "${slug}" is not registered in src/presentations/index.ts`)
  }
}

async function readStep(page) {
  return page.evaluate(() => {
    const text = (sel) => document.querySelector(sel)?.textContent?.trim() ?? ''
    return {
      era: text('[data-presentation-era]'),
      title: text('[data-presentation-title]'),
      caption: text('[data-presentation-caption]'),
    }
  })
}

async function renderSteps(page, url, { slug, outline }, log) {
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`uncaught: ${e.message}`))

  await page.goto(`${url}/${slug}`)
  try {
    await page.waitForSelector('[data-step-count]', { timeout: 15000 })
  } catch {
    throw new Failure('render', `no [data-step-count] hook on /${slug}`, { step: 1, index: 0 })
  }
  const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
  if (outline && count !== OUTLINE.length) {
    throw new Failure('sample', `expected ${OUTLINE.length} steps, found ${count}`)
  }

  for (let index = 0; index < count; index++) {
    const step = index + 1
    if (index > 0) {
      await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction(
          (i) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(i),
          index,
          { timeout: STEP_TIMEOUT_MS },
        )
      } catch {
        const seen = await page.getAttribute('[data-step-index]', 'data-step-index')
        throw new Failure('transition', `ArrowRight did not advance to index ${index} (still ${seen})`, { step, index })
      }
    }
    await page.waitForTimeout(SETTLE_MS)
    if (errors.length) throw new Failure('render', errors[0], { step, index })
    const actual = await readStep(page)
    if (outline) {
      const mismatch = compareStep(OUTLINE[index], actual)
      if (mismatch) throw new Failure('sample', mismatch, { step, index })
    }
    log(`step ${step}/${count} (index ${index}) ok: ${actual.title}`)
  }
  return count
}

export async function verify(root, log = (line) => console.log(`[verify] ${line}`)) {
  const config = loadConfig(root)

  log('build: npm run build')
  runBuild(root)
  log('build ok')

  checkRegistry(root, config.slug)
  log(`sample: "${config.slug}" is registered`)

  const { chromium } = await import('playwright')
  const preview = await startPreview(root, { port: process.env.VERIFY_PORT && Number(process.env.VERIFY_PORT) })
  log(`preview ${preview.url} (pid ${preview.pid}, port ${preview.port})`)
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage()
    const count = await renderSteps(page, preview.url, config, log)
    return count
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

async function main() {
  const root = path.resolve(fileURLToPath(import.meta.url), '..', '..')
  try {
    const count = await verify(root)
    console.log(`PASS verify: build, sample, render, transition (${count} steps)`)
  } catch (error) {
    const failure =
      error instanceof Failure ? error : new Failure('render', error?.stack ?? String(error))
    console.error(formatFailure(failure))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
