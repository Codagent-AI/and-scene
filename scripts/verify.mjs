#!/usr/bin/env node
// Deterministic verification gate: build, sample registration, then render every step in Chromium
// against a production preview bound to 127.0.0.1.
//
// Mode is chosen by the presence of scripts/verify.reference.json beside this script:
//   reference mode     - the canonical sample must be registered, have the reference step count,
//                        and match every reference title/caption/era; every other registered
//                        presentation is also stepped through (count/index/error checks).
//   scaffold-local mode - every registered presentation is stepped through (count/index/error
//                        checks only); fails when nothing is registered.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  HOST,
  VerifyError,
  checkSampleRegistered,
  compareStep,
  findFreePort,
  formatFailure,
  parseReference,
  parseRegistry,
  selectMode,
  slugsToVisit,
} from './lib/verify-helpers.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(process.env.VERIFY_ROOT ?? path.join(scriptDir, '..'))
const REFERENCE_PATH = path.join(scriptDir, 'verify.reference.json')
const REGISTRY_PATH = path.join(ROOT, 'src', 'presentations', 'index.ts')
const STEP_TIMEOUT_MS = Number(process.env.VERIFY_STEP_TIMEOUT_MS ?? 5000)
const SETTLE_MS = Number(process.env.VERIFY_SETTLE_MS ?? 250)

const log = (msg) => console.log(`[verify] ${msg}`)

let previewChild = null
let buildChild = null
let browser = null
let cleaningUp = false

function killGroup(child, signal) {
  if (!child || child.pid === undefined) return
  try {
    process.kill(-child.pid, signal)
  } catch {
    try {
      child.kill(signal)
    } catch {
      /* already gone */
    }
  }
}

async function cleanup() {
  if (cleaningUp) return
  cleaningUp = true
  if (browser) {
    await browser.close().catch(() => {})
    browser = null
  }
  if (buildChild && buildChild.exitCode === null) killGroup(buildChild, 'SIGKILL')
  if (previewChild) {
    const child = previewChild
    previewChild = null
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise((resolve) => child.once('exit', resolve))
      killGroup(child, 'SIGTERM')
      const timer = setTimeout(() => killGroup(child, 'SIGKILL'), 2000)
      await exited
      clearTimeout(timer)
    }
    killGroup(child, 'SIGKILL') // sweep any grandchildren left in the group
  }
}

for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.on(sig, () => {
    console.error(`[verify] FAIL phase=aborted received ${sig}`)
    cleanup().finally(() => process.exit(code))
  })
}

function runBuild() {
  return new Promise((resolve, reject) => {
    log('phase build: running npm run build')
    buildChild = spawn('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit', detached: true })
    buildChild.once('error', (err) => reject(new VerifyError('build', `could not run npm run build: ${err.message}`)))
    buildChild.once('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new VerifyError('build', `npm run build failed (${signal ? `signal ${signal}` : `exit code ${code}`})`))
    })
  })
}

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(res.statusCode !== undefined && res.statusCode < 500)
    })
    req.setTimeout(1000, () => req.destroy())
    req.on('error', () => resolve(false))
  })
}

async function startPreview() {
  const port = process.env.VERIFY_PORT ? Number(process.env.VERIFY_PORT) : await findFreePort(HOST)
  const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(viteBin)) throw new VerifyError('render', `vite is not installed at ${viteBin}`)
  const args = [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort']
  log(`preview: vite preview --host ${HOST} --port ${port} --strictPort`)
  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
  previewChild = child
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  let exited = false
  child.once('exit', () => (exited = true))
  const base = `http://${HOST}:${port}`
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (exited) throw new VerifyError('render', `preview server exited before becoming ready:\n${output.trim()}`)
    if (await probe(`${base}/`)) {
      log(`preview ready: probe ${base}/ ok`)
      return base
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new VerifyError('render', `preview server not ready at ${base}/ within 30s`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Step through one presentation route. `reference` is null in scaffold-local mode. */
async function walkPresentation(context, base, slug, reference) {
  const url = `${base}/${slug}`
  const page = await context.newPage()
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`uncaught page error: ${err.message}`))

  const failIfErrors = (step) => {
    if (errors.length > 0) throw new VerifyError('render', `${slug}: ${errors[0]}`, step)
  }
  const readRoot = () =>
    page.evaluate(() => {
      const el = document.querySelector('[data-presentation-root]')
      if (!el) return null
      return {
        count: Number(el.getAttribute('data-step-count')),
        index: Number(el.getAttribute('data-step-index')),
        mode: el.getAttribute('data-presentation-mode'),
        title: document.querySelector('[data-presentation-title]')?.textContent ?? null,
        caption: document.querySelector('[data-presentation-caption]')?.textContent ?? null,
        era: document.querySelector('[data-presentation-era]')?.textContent ?? null,
      }
    })

  log(`browser: opening ${url}`)
  await page.goto(url, { waitUntil: 'load' })
  try {
    await page.waitForSelector('[data-presentation-root]', { timeout: STEP_TIMEOUT_MS })
  } catch {
    failIfErrors(0)
    throw new VerifyError('render', `${slug}: [data-presentation-root] did not appear at ${url}`, 0)
  }
  await sleep(SETTLE_MS)
  failIfErrors(0)

  let state = await readRoot()
  if (!state) throw new VerifyError('render', `${slug}: presentation root disappeared`, 0)
  const count = state.count
  if (!Number.isInteger(count) || count < 1) {
    throw new VerifyError('render', `${slug}: invalid data-step-count ${state.count}`, 0)
  }
  log(`${slug}: data-step-count=${count}`)
  if (reference && count !== reference.steps.length) {
    throw new VerifyError('render', `${slug}: step count is ${count}, expected ${reference.steps.length}`, 0)
  }
  if (state.index !== 0) throw new VerifyError('render', `${slug}: initial data-step-index is ${state.index}, expected 0`, 0)

  const observed = []
  const checkStep = async (i) => {
    state = await readRoot()
    if (!state) {
      failIfErrors(i)
      throw new VerifyError('render', `${slug}: presentation root disappeared while rendering`, i)
    }
    if (reference) {
      // Titles are present in both modes; captions only in browse mode.
      const wasMode = state.mode
      if (wasMode !== 'browse') {
        await page.keyboard.press('p')
        await sleep(SETTLE_MS)
        state = await readRoot()
        failIfErrors(i)
      }
      const mismatches = compareStep(reference.steps[i], state)
      if (state.caption === null) mismatches.push('caption is not rendered in browse mode')
      if (mismatches.length > 0) throw new VerifyError('render', `${slug}: ${mismatches.join('; ')}`, i)
      // Present mode shows the same title.
      await page.keyboard.press('p')
      await sleep(SETTLE_MS)
      const present = await readRoot()
      failIfErrors(i)
      if (!present || present.index !== i) {
        throw new VerifyError('render', `${slug}: toggling present mode changed the step (index ${present?.index})`, i)
      }
      if (present.mode === 'browse') throw new VerifyError('render', `${slug}: key "p" did not switch to present mode`, i)
      if (present.title !== reference.steps[i].title) {
        throw new VerifyError('render', `${slug}: present-mode title is ${JSON.stringify(present.title)}, expected ${JSON.stringify(reference.steps[i].title)}`, i)
      }
      await page.keyboard.press('p')
      await sleep(SETTLE_MS)
      failIfErrors(i)
      if (wasMode !== 'browse') {
        // Leave the page in the mode it started in.
        await page.keyboard.press('p')
        await sleep(SETTLE_MS)
      }
      state = await readRoot()
    }
    observed.push(i)
    log(`${slug}: step ${i} ok (data-step-index=${i}${state?.title ? `, title=${JSON.stringify(state.title)}` : ''})`)
  }

  await checkStep(0)
  for (let i = 1; i < count; i++) {
    await page.keyboard.press('ArrowRight')
    const deadline = Date.now() + STEP_TIMEOUT_MS
    let idx = null
    while (Date.now() < deadline) {
      failIfErrors(i)
      const s = await readRoot()
      if (!s) {
        await sleep(100)
        failIfErrors(i)
        throw new VerifyError('render', `${slug}: presentation root disappeared after advancing (render crash)`, i)
      }
      idx = s.index
      if (idx === i) break
      if (idx !== i - 1) {
        throw new VerifyError('transition', `${slug}: data-step-index is ${idx} after advancing from ${i - 1}, expected ${i}`, i)
      }
      await sleep(50)
    }
    if (idx !== i) {
      throw new VerifyError('transition', `${slug}: data-step-index stayed at ${idx} after ArrowRight; expected ${i} within ${STEP_TIMEOUT_MS}ms`, i)
    }
    await sleep(SETTLE_MS)
    failIfErrors(i)
    await checkStep(i)
  }
  await page.close()
  log(`${slug}: observed step indices ${observed.join(',')}`)
}

async function main() {
  const mode = selectMode(existsSync(REFERENCE_PATH))
  log(`root: ${ROOT}`)
  log(`mode: ${mode}`)

  await runBuild()
  log('phase build: ok')

  if (!existsSync(REGISTRY_PATH)) {
    throw new VerifyError('sample-registration', `registry not found at ${REGISTRY_PATH}`)
  }
  const registry = parseRegistry(readFileSync(REGISTRY_PATH, 'utf8'))
  let reference = null
  let slugs
  if (mode === 'reference') {
    reference = parseReference(readFileSync(REFERENCE_PATH, 'utf8'))
    checkSampleRegistered(registry, reference)
    // The sample is validated against the reference; every other registered presentation is stepped
    // through exactly as in scaffold-local mode (count/index/error checks).
    slugs = [reference.slug, ...slugsToVisit(registry).filter((s) => s !== reference.slug)]
  } else {
    slugs = slugsToVisit(registry)
  }
  log(`phase sample-registration: ok (${slugs.join(', ')})`)

  const base = await startPreview()
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch (err) {
    throw new VerifyError('render', `playwright is not available: ${err.message}`)
  }
  browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  for (const slug of slugs) {
    await walkPresentation(context, base, slug, reference && slug === reference.slug ? reference : null)
  }
  log('phase render: ok')
  log('phase transition: ok')
}

let exitCode = 0
try {
  await main()
  log('PASS')
} catch (err) {
  console.error(formatFailure(err))
  exitCode = 1
} finally {
  await cleanup()
}
process.exit(exitCode)
