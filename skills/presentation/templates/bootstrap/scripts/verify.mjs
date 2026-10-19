#!/usr/bin/env node
// Deterministic verification: production build, reference-sample check, and a
// Chromium render pass that steps through every step of the configured sample.
//
// Usage: node scripts/verify.mjs [--config <path>] [--skip-build]
//   --config <path>  normative step table (default: <root>/scripts/verify.config.json)
//   --skip-build     test-only: reuse an existing dist/ and skip the build phase
// Env:
//   VERIFY_ROOT      project root (default: process.cwd())
//
// Output lines: `verify: <phase> ok`, `verify: PASS`, or
// `verify: FAIL phase=<phase> step=<index|-> <message>` (exit code 1).
// Every host and URL here is the IPv4 loopback address 127.0.0.1.

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOST = '127.0.0.1'
export const PHASES = ['build', 'sample', 'render', 'transition']
export const TRANSITION_TIMEOUT_MS = 5000
export const SETTLE_MS = 700
const READY_TIMEOUT_MS = 30000
const STOP_GRACE_MS = 3000
const OUTPUT_TAIL_CHARS = 4000

/** A verification failure tied to a phase and, when applicable, a step index. */
export class VerifyFailure extends Error {
  constructor(phase, step, message) {
    super(message)
    this.name = 'VerifyFailure'
    this.phase = phase
    this.step = step ?? null
  }
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/** Parses CLI arguments. Throws on unknown arguments. */
export function parseArgs(argv) {
  const opts = { configPath: null, skipBuild: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--skip-build') opts.skipBuild = true
    else if (arg === '--config') {
      const value = argv[++i]
      if (!value) throw new Error('--config requires a path')
      opts.configPath = value
    } else if (arg.startsWith('--config=')) opts.configPath = arg.slice('--config='.length)
    else throw new Error(`unknown argument: ${arg}`)
  }
  return opts
}

/** Returns an error message for a malformed step table, or null when valid. */
export function validateConfig(config) {
  if (!isObject(config)) return 'config must be a JSON object'
  if (typeof config.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.slug)) {
    return 'config.slug must be a lowercase slug'
  }
  if (!Array.isArray(config.steps) || config.steps.length === 0) {
    return 'config.steps must be a non-empty array'
  }
  for (const [i, step] of config.steps.entries()) {
    for (const key of ['era', 'title', 'caption']) {
      if (!isObject(step) || typeof step[key] !== 'string' || step[key].trim() === '') {
        return `config.steps[${i}].${key} must be a non-empty string`
      }
    }
  }
  return null
}

/**
 * Checks that the registry source contains an entry for `slug` with a lazy
 * loader. Returns `{ error, loader }` where `loader` is the import specifier.
 */
export function checkRegistrySource(source, slug) {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const entry = new RegExp(`slug\\s*:\\s*['"\`]${escaped}['"\`]`).exec(source)
  if (!entry) return { error: `registry has no entry with slug '${slug}'`, loader: null }
  const block = source.slice(entry.index).split('}')[0]
  const loader = /\bload\s*:\s*\(\s*\)\s*=>\s*import\(\s*['"`]([^'"`]+)['"`]\s*\)/.exec(block)
  if (!loader) {
    return { error: `registry entry for '${slug}' has no lazy loader (load: () => import(...))`, loader: null }
  }
  return { error: null, loader: loader[1] }
}

/** Returns an error message when the step count hook is missing or wrong, else null. */
export function checkStepCount(expected, raw) {
  if (raw === null || raw === undefined) return 'missing data-step-count hook on [data-step-count]'
  if (!/^\d+$/.test(raw)) return `data-step-count is not an integer: ${JSON.stringify(raw)}`
  const count = Number(raw)
  if (count !== expected) return `data-step-count is ${count}, expected ${expected} steps from the config`
  return null
}

/** Returns an error message when data-step-index differs from the expected index, else null. */
export function checkStepIndex(expected, raw) {
  if (raw === null || raw === undefined) return 'missing data-step-index hook'
  if (raw !== String(expected)) return `data-step-index is ${JSON.stringify(raw)}, expected ${expected}`
  return null
}

/** Compares a rendered title and browse caption with the normative step. */
export function compareStep(expected, actual) {
  if (actual.title !== expected.title) {
    return `title is ${JSON.stringify(actual.title)}, expected ${JSON.stringify(expected.title)}`
  }
  if (actual.caption === null || actual.caption === undefined) {
    return '[data-presentation-caption] not rendered (browse caption expected)'
  }
  if (actual.caption !== expected.caption) {
    return `caption is ${JSON.stringify(actual.caption)}, expected ${JSON.stringify(expected.caption)}`
  }
  return null
}

export function previewUrl(port, pathname = '/') {
  return `http://${HOST}:${port}${pathname}`
}

/** Command used to start the production preview on the loopback address. */
export function previewCommand(root, port) {
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  return {
    command: process.execPath,
    args: [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
  }
}

export function formatFailure(phase, step, message) {
  return `verify: FAIL phase=${phase} step=${step ?? '-'} ${message}`
}

function tail(text) {
  return text.length > OUTPUT_TAIL_CHARS ? text.slice(-OUTPUT_TAIL_CHARS) : text
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Binds an ephemeral port on the loopback address and returns it. */
export function pickFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Resolves true when the preview answers GET / on the loopback address with 200. */
function probe(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: HOST, port, path: '/', timeout: 1000 }, (res) => {
      res.resume()
      resolve(res.statusCode === 200)
    })
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.on('error', () => resolve(false))
  })
}

/** Starts `vite preview` in its own process group. */
function startPreview(root, port) {
  const { command, args } = previewCommand(root, port)
  const child = spawn(command, args, { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  const collect = (chunk) => {
    output = tail(output + chunk.toString())
  }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  const exited = new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }))
    child.once('error', (error) => resolve({ code: null, signal: null, error }))
  })
  return { child, exited, output: () => output }
}

/** Terminates the preview's whole process group and waits for it to exit. */
export async function stopPreview(handle) {
  if (!handle) return
  const { child, exited } = handle
  const signalGroup = (signal) => {
    try {
      process.kill(-child.pid, signal)
    } catch {
      // Group already gone.
    }
  }
  signalGroup('SIGTERM')
  const finished = await Promise.race([exited.then(() => true), sleep(STOP_GRACE_MS).then(() => false)])
  if (!finished) signalGroup('SIGKILL')
  await exited
}

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')
const stripAnsi = (text) => text.replace(ANSI, '')

async function waitForPreview(port, handle) {
  const deadline = Date.now() + READY_TIMEOUT_MS
  let exitedEarly = null
  handle.exited.then((info) => {
    exitedEarly = info
  })
  while (Date.now() < deadline) {
    if (exitedEarly) {
      throw new VerifyFailure(
        'render',
        null,
        `vite preview exited before becoming ready (code ${exitedEarly.code}, signal ${exitedEarly.signal})\n${handle.output()}`,
      )
    }
    // Only accept a 200 once vite itself reported listening on our port (not a foreign server).
    if (stripAnsi(handle.output()).includes(`${HOST}:${port}`) && (await probe(port))) {
      // A foreign server could answer on the port while our preview already died (port race).
      const { child } = handle
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new VerifyFailure('render', null, `vite preview exited while ${previewUrl(port)} answered\n${handle.output()}`)
      }
      return
    }
    await sleep(250)
  }
  throw new VerifyFailure('render', null, `vite preview was not ready on ${previewUrl(port)} within ${READY_TIMEOUT_MS} ms`)
}

async function readStep(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-step-count]')
    const title = document.querySelector('[data-presentation-title]')
    const caption = document.querySelector('[data-presentation-caption]')
    return {
      index: root ? root.getAttribute('data-step-index') : null,
      count: root ? root.getAttribute('data-step-count') : null,
      title: title ? title.textContent.trim() : null,
      caption: caption ? caption.textContent.trim() : null,
    }
  })
}

/** Opens the sample in Chromium, steps through every step and checks the render. */
async function renderSample({ url, steps, log, slug }) {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch (error) {
    throw new VerifyFailure('render', null, `playwright is not available: ${error.message}`)
  }
  let browser
  try {
    browser = await chromium.launch()
  } catch (error) {
    throw new VerifyFailure('render', null, `could not launch Chromium: ${error.message.split('\n')[0]}`)
  }
  try {
    const page = await browser.newPage()
    const problems = []
    let reported = 0
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console.error: ${message.text()}`)
    })
    page.on('pageerror', (error) => problems.push(`uncaught page error: ${error.message}`))
    const checkProblems = (step) => {
      if (problems.length > reported) {
        const first = problems[reported]
        reported = problems.length
        throw new VerifyFailure('render', step, `${first} (step ${step} of ${steps.length})`)
      }
    }

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 })
    } catch (error) {
      throw new VerifyFailure('render', 0, `could not open ${url}: ${error.message.split('\n')[0]}`)
    }
    try {
      await page.waitForSelector('[data-step-count]', { state: 'attached', timeout: 15000 })
    } catch {
      throw new VerifyFailure('render', 0, `no [data-step-count] hook rendered at ${url}`)
    }

    const first = await readStep(page)
    const countError = checkStepCount(steps.length, first.count)
    if (countError) throw new VerifyFailure('render', null, countError)
    const indexError = checkStepIndex(0, first.index)
    if (indexError) throw new VerifyFailure('render', 0, indexError)

    for (let i = 0; i < steps.length; i++) {
      await sleep(SETTLE_MS)
      const observed = await readStep(page)
      const mismatch = compareStep(steps[i], observed)
      if (mismatch) throw new VerifyFailure('render', i, `${mismatch} (step ${i} of ${steps.length})`)
      checkProblems(i)
      log(`verify: step ${i} rendered: ${JSON.stringify(observed.title)}`)

      if (i === steps.length - 1) break
      try {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (expected) => {
            const root = document.querySelector('[data-step-index]')
            return root !== null && root.getAttribute('data-step-index') === String(expected)
          },
          i + 1,
          { timeout: TRANSITION_TIMEOUT_MS },
        )
      } catch {
        // A render crash at the destination step surfaces as a page/console error, not a stall.
        checkProblems(i + 1)
        const after = await readStep(page)
        throw new VerifyFailure(
          'transition',
          i,
          `ArrowRight did not advance from step ${i} to ${i + 1} within ${TRANSITION_TIMEOUT_MS} ms (data-step-index is ${JSON.stringify(after.index)})`,
        )
      }
    }
    await sleep(SETTLE_MS)
    checkProblems(steps.length - 1)
    log(`verify: render ok (${steps.length} steps, no console or page errors)`)
    log(`verify: transition ok (ArrowRight advanced ${steps.length - 1} times in ${slug})`)
  } finally {
    await browser.close().catch(() => {})
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/** Cleanups for in-flight runs, invoked on SIGINT/SIGTERM so no preview survives. */
const activeCleanup = new Set()

/** Runs all phases. Returns an exit code and never throws. */
export async function runVerify({ root, configPath, skipBuild, log, errorLog, env = process.env }) {
  const state = { phase: 'build', handle: null }
  const cleanup = () => stopPreview(state.handle)
  activeCleanup.add(cleanup)
  try {
    // build
    if (skipBuild) {
      log('verify: build skipped (--skip-build)')
    } else {
      const result = spawnSync('npm', ['run', 'build'], {
        cwd: root,
        encoding: 'utf8',
        env,
        shell: process.platform === 'win32',
      })
      if (result.error || result.status !== 0) {
        const detail = result.error ? result.error.message : tail(`${result.stdout}${result.stderr}`)
        throw new VerifyFailure('build', null, `npm run build failed${result.status !== null ? ` (exit ${result.status})` : ''}\n${detail}`)
      }
      log('verify: build ok')
    }

    // sample
    state.phase = 'sample'
    let config
    try {
      config = readJson(configPath)
    } catch (error) {
      throw new VerifyFailure('sample', null, `cannot read step table ${configPath}: ${error.message}`)
    }
    const configError = validateConfig(config)
    if (configError) throw new VerifyFailure('sample', null, `invalid step table: ${configError}`)
    const registryFile = path.join(root, 'src', 'presentations', 'index.ts')
    let source
    try {
      source = fs.readFileSync(registryFile, 'utf8')
    } catch {
      throw new VerifyFailure('sample', null, `registry ${registryFile} is missing`)
    }
    const registry = checkRegistrySource(source, config.slug)
    if (registry.error) throw new VerifyFailure('sample', null, registry.error)
    if (registry.loader.startsWith('.')) {
      const base = path.resolve(path.dirname(registryFile), registry.loader)
      const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
      if (!candidates.some((file) => fs.existsSync(file))) {
        throw new VerifyFailure('sample', null, `registered sample loader ${registry.loader} does not resolve to a file`)
      }
    }
    log(`verify: sample ok (${config.slug}, ${config.steps.length} steps)`)

    // render + transition
    state.phase = 'render'
    const port = await pickFreePort()
    log(`verify: preview http://${HOST}:${port}`)
    state.handle = startPreview(root, port)
    log(`verify: preview pid ${state.handle.child.pid}`)
    await waitForPreview(port, state.handle)
    log('verify: preview ready')
    await renderSample({
      url: previewUrl(port, `/${config.slug}`),
      steps: config.steps,
      slug: config.slug,
      log,
    })
    await stopPreview(state.handle)
    state.handle = null

    log('verify: PASS')
    return 0
  } catch (error) {
    const failure =
      error instanceof VerifyFailure ? error : new VerifyFailure(state.phase, null, error?.message ?? String(error))
    errorLog(formatFailure(failure.phase, failure.step, failure.message))
    return 1
  } finally {
    activeCleanup.delete(cleanup)
    await stopPreview(state.handle)
    state.handle = null
  }
}

let signalled = false

async function cleanupOnSignal(signal) {
  if (signalled) return // a repeated signal must not skip the in-flight cleanup
  signalled = true
  await Promise.all([...activeCleanup].map((fn) => fn().catch(() => {})))
  process.exit(signal === 'SIGINT' ? 130 : 143)
}

function isDirectRun() {
  if (!process.argv[1]) return false
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  process.on('SIGINT', () => cleanupOnSignal('SIGINT'))
  process.on('SIGTERM', () => cleanupOnSignal('SIGTERM'))
  let opts
  try {
    opts = parseArgs(argv)
  } catch (error) {
    console.error(`verify: ${error.message}`)
    return 2
  }
  const root = path.resolve(env.VERIFY_ROOT || process.cwd())
  const configPath = opts.configPath
    ? path.resolve(process.cwd(), opts.configPath)
    : path.join(root, 'scripts', 'verify.config.json')
  return runVerify({
    root,
    configPath,
    skipBuild: opts.skipBuild,
    log: (line) => console.log(line),
    errorLog: (line) => console.log(line),
    env,
  })
}

if (isDirectRun()) {
  main().then((code) => process.exit(code))
}
