// Deterministic gate: build the whole app, check the reference presentation is
// registered, then render it through every step in Chromium against a production preview.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { HOST, projectRoot, readIndex, run, startPreview, waitForIndex } from './lib.mjs'

const root = projectRoot

// The committed reference sample of the and-scene repository. It is enforced here, not
// read from replaceable project configuration, whenever the project is and-scene itself.
const CANONICAL = {
  slug: 'how-to-make-a-presentation',
  steps: [
    { title: "You have a topic", caption: "It starts with you, a topic, and mild overconfidence." },
    { title: "The skill interviews you", caption: "One question at a time: the topic, the look, then each beat of the story." },
    { title: "Answers become steps", caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next." },
    { title: "The deck grows", caption: "Same shapes, new beats. Every answer extends the story without redrawing it." },
    { title: "You set the depth", caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate." },
    { title: "It assembles the scene", caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph." },
    { title: "It checks its own work", caption: "Before saying done, it builds and renders every step — and fixes what breaks." },
    { title: "Changed your mind? Loop it.", caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch." },
    { title: "You're looking at one", caption: "This presentation was built exactly this way. Thanks for watching." },
  ],
}

const isAndScene = () => JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name === 'and-scene'

class Failure extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

/** Every reference this project must render: the canonical sample and/or its own configured one. */
function loadReferences() {
  const refs = isAndScene() ? [CANONICAL] : []
  const file = path.join(root, 'verify.config.json')
  if (fs.existsSync(file)) {
    const configured = JSON.parse(fs.readFileSync(file, 'utf8')).reference
    if (!refs.some((r) => r.slug === configured.slug)) refs.push(configured)
  }
  if (refs.length === 0) throw new Failure('sample', 'no reference presentation: verify.config.json is missing')
  return refs
}

const SOURCE = /\.[tj]sx?$/
const SKIP = new Set(['node_modules', 'dist', '.git', '.inspection'])

function sourceFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return SKIP.has(e.name) ? [] : sourceFiles(full)
    return SOURCE.test(e.name) ? [full] : []
  })
}

/**
 * The reference must be a registry entry (`slug` + lazy `load`, matched within that one entry) whose imported module exists.
 * The registry is found by contract, not by name, so renamed registry files and folders verify too.
 */
function checkRegistered(slug) {
  const entry = new RegExp(`slug:\\s*['"]${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"][^{}]*?load:[^{}]*?import\\(\\s*['"]([^'"]+)['"]`)
  for (const file of sourceFiles(path.join(root, 'src'))) {
    const found = fs.readFileSync(file, 'utf8').match(entry)
    if (!found) continue
    const base = path.resolve(path.dirname(file), found[1])
    const rel = path.relative(root, file)
    const exts = ['.ts', '.tsx', '.js', '.jsx']
    const candidates = [base, ...exts.map((x) => base + x), ...exts.map((x) => path.join(base, `index${x}`))]
    if (!candidates.some((c) => fs.existsSync(c) && fs.statSync(c).isFile())) {
      throw new Failure('sample', `reference presentation "${slug}" is registered in ${rel} but ${found[1]} does not exist`)
    }
    return
  }
  throw new Failure('sample', `reference presentation "${slug}" is not registered in any presentation registry under src/ (an entry needs its own { slug, load: () => import('./...') })`)
}

async function render(reference, preview, browser) {
  const page = await browser.newPage()
  // `current` is the step being rendered, so errors raised by a transition belong to its target.
  let current = 0
  const errors = []
  const note = (kind, text) => errors.push(new Failure('render', `${kind}: ${text}`, current))
  page.on('console', (m) => m.type() === 'error' && note('console.error', m.text()))
  page.on('pageerror', (e) => note('pageerror', e.message))

  const url = `${preview.base}/${reference.slug}`
  if (!url.startsWith(`http://${HOST}:`)) throw new Failure('render', `unexpected URL ${url}`)
  await page.goto(url)
  try {
    await page.waitForSelector('[data-step-count]', { timeout: 10_000 })
  } catch {
    throw errors[0] ?? new Failure('render', `route ${url} did not render a presentation`, 0)
  }
  const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
  if (count !== reference.steps.length) {
    throw new Failure('sample', `expected ${reference.steps.length} steps, found ${count}`)
  }
  if (!(await page.$('[data-presentation-caption]'))) await page.keyboard.press('p')

  for (let step = 0; step < count; step++) {
    current = step
    if (!(await waitForIndex(page, step))) {
      throw new Failure('transition', `step index did not advance to ${step} (at ${await readIndex(page)})`, step)
    }
    await page.waitForTimeout(300)
    const title = await page.textContent('[data-presentation-title]')
    const caption = await page.textContent('[data-presentation-caption]')
    const want = reference.steps[step]
    if (title !== want.title || caption !== want.caption) {
      throw new Failure('sample', `step ${step} title/caption differ from the reference (got "${title}")`, step)
    }
    if (errors.length) throw errors[0]
    if (step < count - 1) {
      current = step + 1
      await page.keyboard.press('ArrowRight')
    }
  }
  await page.waitForTimeout(500)
  if (errors.length) throw errors[0]
  await page.close()
  return count
}

async function renderAll(references) {
  const preview = await startPreview(root).catch((e) => {
    throw new Failure('preview', e.message)
  })
  let browser
  try {
    browser = await chromium.launch().catch((e) => {
      throw new Failure('render', `browser launch failed: ${e.message.split('\n')[0]}`)
    })
    const counts = []
    for (const reference of references) counts.push([reference.slug, await render(reference, preview, browser)])
    return counts
  } finally {
    await browser?.close()
    preview.stop()
  }
}

async function main() {
  const build = await run('npm', ['run', 'build'], root)
  if (build.code !== 0) throw new Failure('build', `npm run build failed\n${build.output.slice(-2000)}`)
  console.log('[verify] build: ok')

  const references = loadReferences()
  for (const { slug } of references) {
    checkRegistered(slug)
    console.log(`[verify] sample: "${slug}" is registered`)
  }

  for (const [slug, steps] of await renderAll(references)) {
    console.log(`[verify] render: ${slug}: ${steps} steps rendered without errors on ${HOST}`)
  }
}

main().then(
  () => console.log('VERIFY PASSED'),
  (e) => {
    const where = e.step === undefined ? '' : ` step=${e.step}`
    console.error(`VERIFY FAILED phase=${e.phase ?? 'internal'}${where}: ${e.message}`)
    process.exit(1)
  },
)
