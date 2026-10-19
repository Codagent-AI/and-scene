#!/usr/bin/env node
/**
 * Deterministic verification gate for the presentation app (`npm run verify`).
 *
 * Phases run in order and the first failure stops the run:
 *   build   npm run build (tsc -b plus the Vite production build)
 *   sample  the reference sample is registered in src/presentations/index.ts
 *   render  vite preview on 127.0.0.1; Chromium steps through every sample step
 *
 * An optional verify.config.json at the project root with {"sample": false} skips the
 * sample check and renders every slug registered in src/presentations/index.ts instead.
 *
 * Only Node built-ins and the `playwright` package are imported. Usage:
 *   node scripts/verify.mjs [--root <project dir>]     (VERIFY_PORT optional)
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createServer } from 'node:net'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const SAMPLE_SLUG = 'how-to-make-a-presentation'
const HOST = '127.0.0.1'
const READY_TIMEOUT_MS = 30_000
const TRANSITION_TIMEOUT_MS = 5_000
/** Wait after each step change so motion settles before the step is judged. */
const SETTLE_MS = 1_500

/**
 * Normative sample outline (presentation-verification spec). Written out
 * independently on purpose: this script must not import from src/.
 */
export const EXPECTED_SAMPLE = Object.freeze([
  { era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.' },
  { era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.' },
  { era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.' },
  { era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.' },
  { era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.' },
  { era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.' },
  { era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.' },
  { era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.' },
  { era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.' },
])

/** A failed check. `phase` is the verification phase; `index` is the 0-based step index when relevant. */
export class VerifyFailure extends Error {
  constructor(phase, message, index) {
    super(message)
    this.phase = phase
    this.index = index
  }
}

export function describeStep(index) {
  return `step ${index + 1} (index ${index})`
}

export function formatFailure(phase, message, index) {
  const at = index === undefined ? '' : `${describeStep(index)}: `
  return `FAIL [${phase}] ${at}${message}`
}

export function parseArgs(argv) {
  let root = process.cwd()
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--root') {
      const value = argv[++i]
      if (!value) throw new VerifyFailure('usage', '--root requires a directory')
      root = value
    } else if (arg.startsWith('--root=')) {
      root = arg.slice('--root='.length)
    } else {
      throw new VerifyFailure('usage', `unknown argument: ${arg}`)
    }
  }
  return { root: resolve(root) }
}

/** Registry source with block comments and full-line comments removed. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** Slugs declared as `slug: '...'` entries in the registry source, in order, without duplicates. */
export function parseRegisteredSlugs(source) {
  const slugs = []
  for (const match of stripComments(source).matchAll(/slug:\s*['"]([^'"]+)['"]/g)) {
    if (!slugs.includes(match[1])) slugs.push(match[1])
  }
  return slugs
}

/** True when the registry source declares an entry whose slug is the given string. */
export function checkRegistration(source, slug) {
  return parseRegisteredSlugs(source).includes(slug)
}

export const CONFIG_FILE = 'verify.config.json'

/** Parses verify.config.json text. Only `sample` (boolean, default true) is recognised. */
export function parseVerifyConfig(text) {
  let value
  try {
    value = JSON.parse(text)
  } catch (err) {
    throw new VerifyFailure('config', `${CONFIG_FILE} is not valid JSON: ${errorText(err)}`)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new VerifyFailure('config', `${CONFIG_FILE} must contain a JSON object`)
  }
  const sample = value.sample ?? true
  if (typeof sample !== 'boolean') {
    throw new VerifyFailure('config', `${CONFIG_FILE}: "sample" must be true or false`)
  }
  return { sample }
}

/** Reads the optional project-root config. Absent file means the defaults (sample required). */
export function readVerifyConfig(root) {
  const file = join(root, CONFIG_FILE)
  if (!existsSync(file)) return { sample: true }
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch (err) {
    throw new VerifyFailure('config', `cannot read ${CONFIG_FILE}: ${errorText(err)}`)
  }
  return parseVerifyConfig(text)
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
const errorText = (err) => (err && err.message) || String(err)

function runBuild(root) {
  return new Promise((done, fail) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
    child.on('error', (err) => fail(new VerifyFailure('build', `could not start npm run build: ${errorText(err)}`)))
    child.on('close', (code, signal) => {
      if (code === 0) done()
      else fail(new VerifyFailure('build', `npm run build failed (${signal ?? `exit ${code}`})`))
    })
  })
}

const REGISTRY_PATH = 'src/presentations/index.ts'

function readRegistry(root) {
  try {
    return readFileSync(join(root, REGISTRY_PATH), 'utf8')
  } catch {
    throw new VerifyFailure('sample', `cannot read ${REGISTRY_PATH}`)
  }
}

function checkSampleRegistered(root) {
  if (!checkRegistration(readRegistry(root), SAMPLE_SLUG)) {
    throw new VerifyFailure('sample', `sample "${SAMPLE_SLUG}" is not registered in ${REGISTRY_PATH}`)
  }
}

/** Targets for the render phase: the reference sample, or every registered slug when sample is off. */
function renderTargets(root, config) {
  if (config.sample) return [SAMPLE_SLUG]
  const slugs = parseRegisteredSlugs(readRegistry(root))
  if (slugs.length === 0) throw new VerifyFailure('sample', `no presentations registered in ${REGISTRY_PATH}`)
  return slugs
}

async function choosePort() {
  const env = process.env.VERIFY_PORT
  if (env !== undefined && env !== '') {
    const port = Number(env)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new VerifyFailure('render', `VERIFY_PORT must be a TCP port number, got "${env}"`)
    }
    return port
  }
  return new Promise((done, fail) => {
    const server = createServer()
    server.unref()
    server.once('error', fail)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => done(port))
    })
  })
}

/** The preview child runs in its own process group so the whole group can be stopped. */
let livePreview = null

function startPreview(vite, root, port) {
  const child = spawn(vite, ['preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const log = { text: '' }
  const keep = (chunk) => {
    log.text = (log.text + chunk).slice(-4000)
  }
  child.stdout.on('data', keep)
  child.stderr.on('data', keep)
  child.on('error', (err) => keep(`\n${errorText(err)}`))
  const exited = new Promise((done) => child.once('exit', done))
  livePreview = { child, exited, log }
  return livePreview
}

function signalGroup(pid, signal) {
  if (!pid) return
  try {
    process.kill(-pid, signal)
  } catch {
    // The group is already gone.
  }
}

async function stopPreview(preview) {
  if (!preview) return
  const { child, exited } = preview
  if (livePreview === preview) livePreview = null
  signalGroup(child.pid, 'SIGTERM')
  let timer
  const timedOut = new Promise((done) => {
    timer = setTimeout(() => done('timeout'), 3_000)
  })
  const outcome = await Promise.race([exited.then(() => 'exited'), timedOut])
  clearTimeout(timer)
  if (outcome === 'timeout') signalGroup(child.pid, 'SIGKILL')
  await exited
  signalGroup(child.pid, 'SIGKILL')
}

async function waitReady(preview, base) {
  let exitedEarly = false
  preview.exited.then(() => {
    exitedEarly = true
  })
  const deadline = Date.now() + READY_TIMEOUT_MS
  for (;;) {
    if (exitedEarly) {
      throw new VerifyFailure('render', `vite preview exited before it was ready:\n${preview.log.text.trim()}`)
    }
    try {
      const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(1_000) })
      await res.arrayBuffer()
      if (res.ok) return
    } catch {
      // Not listening yet.
    }
    if (Date.now() > deadline) {
      throw new VerifyFailure('render', `preview did not become ready at ${base}/ within ${READY_TIMEOUT_MS} ms`)
    }
    await sleep(200)
  }
}

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch (err) {
    throw new VerifyFailure('render', `playwright is not available: ${errorText(err)}`)
  }
}

/** Listeners are attached before any navigation; they feed a queue drained at each step. */
function collectErrors(page) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`pageerror: ${errorText(err)}`))
  page.on('crash', () => errors.push('page crashed'))
  return errors
}

async function advance(page, index) {
  await page.keyboard.press('ArrowRight')
  const advanced = await page
    .waitForFunction(
      (want) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(want),
      index,
      { timeout: TRANSITION_TIMEOUT_MS },
    )
    .then(() => true, () => false)
  if (!advanced) {
    const observed = await page.getAttribute('[data-presentation-root]', 'data-step-index')
    throw new VerifyFailure(
      'render',
      `transition did not advance: ArrowRight left data-step-index at ${observed}`,
      index,
    )
  }
}

async function checkStepContent(page, index) {
  const shown = await page.evaluate(() => {
    const title = document.querySelector('header [data-presentation-title]')
    const caption = document.querySelector('[data-presentation-caption]')
    return {
      title: title ? title.textContent.trim() : null,
      caption: caption ? caption.textContent.trim() : null,
    }
  })
  const want = EXPECTED_SAMPLE[index]
  for (const field of ['title', 'caption']) {
    if (shown[field] !== want[field]) {
      throw new VerifyFailure(
        'sample',
        `${field} is ${JSON.stringify(shown[field])}, expected ${JSON.stringify(want[field])}`,
        index,
      )
    }
  }
  console.log(`  ok ${describeStep(index)}: ${want.title}`)
}

/**
 * Steps one presentation from its first to its last step. The sample also checks each
 * step's browse title and caption against the normative table; other presentations are
 * only checked for clean rendering and working transitions.
 */
async function stepThrough(page, url, errors, { sample, slug }) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 })
  } catch (err) {
    throw new VerifyFailure('render', `could not open ${url}: ${errorText(err)}`)
  }
  const mounted = await page
    .waitForSelector('[data-presentation-root]', { timeout: 15_000 })
    .then(() => true, () => false)
  if (!mounted) throw new VerifyFailure('render', `no presentation rendered at ${url}`)

  const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
  if (sample && count !== EXPECTED_SAMPLE.length) {
    throw new VerifyFailure('sample', `expected ${EXPECTED_SAMPLE.length} steps, data-step-count reports ${count}`)
  }
  if (!(count >= 1)) throw new VerifyFailure('render', `data-step-count reports ${count} steps`)

  for (let index = 0; index < count; index++) {
    if (index > 0) await advance(page, index)
    await sleep(SETTLE_MS)
    const seen = errors.splice(0)
    if (seen.length > 0) {
      const more = seen.length > 1 ? ` (and ${seen.length - 1} more)` : ''
      throw new VerifyFailure('render', `${seen[0]}${more}`, index)
    }
    if (sample) await checkStepContent(page, index)
    else console.log(`  ok ${describeStep(index)}`)
  }
  return count
}

async function renderTarget(browser, base, slug, sample) {
  const url = `${base}/${slug}`
  const page = await browser.newPage()
  try {
    const errors = collectErrors(page)
    console.log(`open ${url}`)
    return await stepThrough(page, url, errors, { sample, slug })
  } catch (err) {
    // Name the presentation when several are verified; the sample keeps its plain messages.
    if (err instanceof VerifyFailure && !sample) err.message += ` (presentation ${slug})`
    throw err
  } finally {
    await page.close().catch(() => {})
  }
}

async function renderPhase(root, config) {
  const vite = join(root, 'node_modules', '.bin', 'vite')
  if (!existsSync(vite)) {
    throw new VerifyFailure('render', 'node_modules/.bin/vite is missing; install dependencies first')
  }
  const targets = renderTargets(root, config)
  const port = await choosePort()
  const base = `http://${HOST}:${port}`
  console.log(`preview ${base}`)
  const preview = startPreview(vite, root, port)
  let browser
  try {
    await waitReady(preview, base)
    console.log(`ready ${base}/`)

    const { chromium } = await loadPlaywright()
    try {
      browser = await chromium.launch({ headless: true })
    } catch (err) {
      throw new VerifyFailure('render', `could not launch Chromium (try: npx playwright install chromium): ${errorText(err)}`)
    }
    let steps = 0
    for (const slug of targets) {
      steps += await renderTarget(browser, base, slug, config.sample)
    }
    return { base, presentations: targets.length, steps }
  } finally {
    await browser?.close().catch(() => {})
    await stopPreview(preview)
  }
}

export async function main(argv = process.argv.slice(2)) {
  let phase = 'usage'
  try {
    const { root } = parseArgs(argv)
    phase = 'config'
    const config = readVerifyConfig(root)

    phase = 'build'
    console.log(`[build] npm run build in ${root}`)
    await runBuild(root)
    console.log('build ok')

    phase = 'sample'
    if (config.sample) {
      checkSampleRegistered(root)
      console.log(`sample ok: ${SAMPLE_SLUG} is registered`)
    } else {
      console.log(`sample skipped: ${CONFIG_FILE} sets "sample" to false`)
    }

    phase = 'render'
    const { base, presentations, steps } = await renderPhase(root, config)
    if (config.sample) {
      console.log(
        `PASS verify: build ok, sample ok, render ok (${steps} of ${steps} steps rendered cleanly at ${base}/${SAMPLE_SLUG})`,
      )
    } else {
      console.log(
        `PASS verify: build ok, sample skipped, render ok (${presentations} registered presentation${presentations === 1 ? '' : 's'}, ${steps} steps rendered cleanly at ${base})`,
      )
    }
    return 0
  } catch (err) {
    const failure = err instanceof VerifyFailure ? err : new VerifyFailure(phase, errorText(err))
    console.error(formatFailure(failure.phase, failure.message, failure.index))
    return 1
  }
}

function isMainModule() {
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
  } catch {
    return false
  }
}

if (isMainModule()) {
  const onSignal = (signal) => {
    if (livePreview) signalGroup(livePreview.child.pid, 'SIGKILL')
    process.exit(signal === 'SIGINT' ? 130 : 143)
  }
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)
  process.exitCode = await main()
}
