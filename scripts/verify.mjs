#!/usr/bin/env node
// Whole-app verification: build, sample registration, then a real browser render.
// Run from anywhere with `npm run verify`; every path resolves from this project's root.
// Exit 0 means every phase passed. Any failure prints `FAIL [<phase>] <detail>` and exits 1.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { get } from 'node:http'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_FILE = join(PROJECT_ROOT, 'src', 'presentations', 'index.ts')
const VITE_BIN = join(PROJECT_ROOT, 'node_modules', 'vite', 'bin', 'vite.js')

const PREVIEW_READY_TIMEOUT_MS = 30_000
const TRANSITION_TIMEOUT_MS = 3_000
// Newcomers fade in after persisting entities settle (about 1.0s plus 0.4s), so wait past that.
const SETTLE_MS = 1_800
const INSTALL_TIMEOUT_MS = 600_000
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx'

// ── Reference sample expectations ────────────────────────────────────────────
// The only block that knows about the committed sample. Set it to `null` in a project
// without the reference sample: the generic checks still build, render, and step every
// registered presentation.
export const REFERENCE_SAMPLE = {
  slug: 'how-to-make-a-presentation',
  steps: [
    {
      title: 'You have a topic',
      caption: 'It starts with you, a topic, and mild overconfidence.',
    },
    {
      title: 'The skill interviews you',
      caption: 'One question at a time: the topic, the look, then each beat of the story.',
    },
    {
      title: 'Answers become steps',
      caption:
        'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
    },
    {
      title: 'The deck grows',
      caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
    },
    {
      title: 'You set the depth',
      caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
    },
    {
      title: 'It assembles the scene',
      caption:
        'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
    },
    {
      title: 'It checks its own work',
      caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
    },
    {
      title: 'Changed your mind? Loop it.',
      caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
    },
    {
      title: "You're looking at one",
      caption: 'This presentation was built exactly this way. Thanks for watching.',
    },
  ],
}

// ── Pure helpers (exported for tests) ────────────────────────────────────────

export class VerifyFailure extends Error {
  constructor(phase, message) {
    super(message)
    this.name = 'VerifyFailure'
    this.phase = phase
  }
}

/** Slugs declared in a presentation registry source file, in declaration order. */
export function parseRegisteredSlugs(source) {
  return [...source.matchAll(/\bslug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
}

/** Human-readable step position. Shared by every step-scoped message so reports stay greppable. */
export function stepLabel(index, count) {
  return `step index ${index} (step ${index + 1} of ${count})`
}

/** Collapses whitespace so rendered text compares against source text. */
export function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

/** Null when the observed title and caption match the expectation, otherwise a reason. */
export function compareStep(expected, observed) {
  if (normalizeText(observed.title) !== normalizeText(expected.title)) {
    return `title is "${normalizeText(observed.title)}", expected "${expected.title}"`
  }
  if (observed.caption === null) return `no caption is rendered in browse mode, expected "${expected.caption}"`
  if (normalizeText(observed.caption) !== normalizeText(expected.caption)) {
    return `caption is "${normalizeText(observed.caption)}", expected "${expected.caption}"`
  }
  return null
}

/** Single-line FAIL report that names the phase. */
export function formatFailure(phase, message) {
  return `FAIL [${phase}] ${message}`
}

function lastLines(text, count = 25) {
  return text.trim().split('\n').slice(-count).join('\n')
}

// ── Build ────────────────────────────────────────────────────────────────────

function runBuild() {
  const result = spawnSync(NPM, ['run', 'build'], { cwd: PROJECT_ROOT, encoding: 'utf8' })
  if (result.status !== 0) {
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    throw new VerifyFailure('build', `npm run build exited ${result.status ?? result.signal}\n${lastLines(output)}`)
  }
}

// ── Sample registration ──────────────────────────────────────────────────────

function checkRegistry() {
  const source = existsSync(REGISTRY_FILE) ? readFileSync(REGISTRY_FILE, 'utf8') : ''
  const registered = parseRegisteredSlugs(source)
  if (REFERENCE_SAMPLE && !registered.includes(REFERENCE_SAMPLE.slug)) {
    throw new VerifyFailure(
      'sample registration',
      `reference sample "${REFERENCE_SAMPLE.slug}" is not registered in src/presentations/index.ts`,
    )
  }
  return registered
}

// ── Browser provisioning ─────────────────────────────────────────────────────

async function provisionBrowser() {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch (error) {
    throw new VerifyFailure('browser provisioning', `playwright is not installed: ${firstLine(error)}`)
  }

  // Idempotent: a no-op when Chromium is already cached.
  const install = spawnSync(NPX, ['playwright', 'install', 'chromium'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: INSTALL_TIMEOUT_MS,
  })
  if (install.status !== 0) {
    console.warn(
      `verify: warning: "npx playwright install chromium" exited ${install.status ?? install.signal}; trying the cached browser`,
    )
  }

  try {
    return await chromium.launch({ headless: true })
  } catch (error) {
    throw new VerifyFailure(
      'browser provisioning',
      `Playwright Chromium cannot be launched. Run "npx playwright install chromium" and retry. (${firstLine(error)})`,
    )
  }
}

// ── Preview server ───────────────────────────────────────────────────────────

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolvePort(port))
    })
  })
}

function startPreview(port) {
  if (!existsSync(VITE_BIN)) {
    throw new VerifyFailure('preview', 'vite is not installed; run npm ci first')
  }
  const child = spawn(
    process.execPath,
    [VITE_BIN, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: PROJECT_ROOT,
      // A process group lets stop kill the whole preview tree, not just the launcher.
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  const preview = { child, port, output: '' }
  const capture = (chunk) => {
    preview.output = (preview.output + chunk.toString()).slice(-8_000)
  }
  child.stdout.on('data', capture)
  child.stderr.on('data', capture)
  return preview
}

function probe(url) {
  return new Promise((resolveProbe) => {
    const req = get(url, (res) => {
      res.resume()
      resolveProbe((res.statusCode ?? 500) < 500)
    })
    req.setTimeout(2_000, () => req.destroy())
    req.on('error', () => resolveProbe(false))
  })
}

async function waitForPreview(preview) {
  const url = `http://127.0.0.1:${preview.port}/`
  const deadline = Date.now() + PREVIEW_READY_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (preview.child.exitCode !== null || preview.child.signalCode !== null) {
      throw new VerifyFailure('preview', `vite preview exited before it was ready\n${lastLines(preview.output)}`)
    }
    if (await probe(url)) return
    await delay(250)
  }
  throw new VerifyFailure('preview', `vite preview did not answer at ${url} within ${PREVIEW_READY_TIMEOUT_MS}ms`)
}

function stopPreview(preview) {
  if (!preview) return Promise.resolve()
  const { child } = preview
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  const exited = new Promise((resolveExit) => child.once('exit', resolveExit))
  signalPreview(child, 'SIGTERM')
  return Promise.race([exited, delay(5_000)]).then(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      signalPreview(child, 'SIGKILL')
      await exited
    }
  })
}

function signalPreview(child, signal) {
  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch {
    // The group is already gone.
  }
}

// ── Browser render ───────────────────────────────────────────────────────────

/** Reads the chrome of the active step: browse-mode title and caption. */
async function readStep(page) {
  const title = (await page.locator('[data-presentation-title]').first().textContent()) ?? ''
  const captionLocator = page.locator('[data-presentation-caption]')
  const caption = (await captionLocator.count()) > 0 ? await captionLocator.first().textContent() : null
  return { title, caption }
}

async function readStepIndex(page) {
  return page.locator('[data-presentation-root]').getAttribute('data-step-index')
}

async function waitForStepIndex(page, index) {
  try {
    await page.waitForFunction(
      (expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected),
      index,
      { timeout: TRANSITION_TIMEOUT_MS },
    )
    return true
  } catch {
    return false
  }
}

async function renderPresentation(browser, baseUrl, slug, expected, log) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`uncaught page error: ${firstLine(error)}`))

  try {
    const url = `${baseUrl}/${slug}`
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 })
    const root = page.locator('[data-presentation-root]')
    try {
      await root.waitFor({ state: 'attached', timeout: 15_000 })
    } catch {
      const detail = errors.length ? ` Errors: ${errors.join('; ')}` : ''
      throw new VerifyFailure('render', `${url} did not render a presentation.${detail}`)
    }

    const count = Number(await root.getAttribute('data-step-count'))
    if (expected && count !== expected.steps.length) {
      throw new VerifyFailure(
        'sample registration',
        `${slug} reports ${count} steps; the reference sample has ${expected.steps.length}`,
      )
    }

    for (let index = 0; index < count; index += 1) {
      const errorsBefore = index === 0 ? 0 : errors.length
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
      }
      const arrived = await waitForStepIndex(page, index)
      await delay(SETTLE_MS)

      const fresh = errors.slice(errorsBefore)
      if (fresh.length > 0) {
        throw new VerifyFailure('render', `${slug} ${stepLabel(index, count)}: ${fresh[0]}`)
      }
      if (!arrived) {
        const actual = await readStepIndex(page)
        throw new VerifyFailure(
          'transition',
          `${slug} ArrowRight did not advance to ${stepLabel(index, count)}; data-step-index is still ${actual}`,
        )
      }

      const observed = await readStep(page)
      if (expected) {
        const mismatch = compareStep(expected.steps[index], observed)
        if (mismatch) {
          throw new VerifyFailure('sample registration', `${slug} ${stepLabel(index, count)}: ${mismatch}`)
        }
      }
      log(`  ok ${slug}: step ${index + 1}/${count} (index ${index}): ${normalizeText(observed.title)}`)
    }
    return count
  } finally {
    await context.close()
  }
}

// ── Driver ───────────────────────────────────────────────────────────────────

const active = { preview: null, browser: null }

async function cleanup() {
  await active.browser?.close().catch(() => {})
  active.browser = null
  await stopPreview(active.preview)
  active.preview = null
}

async function main() {
  const log = (line) => console.log(line)

  log('verify: build (npm run build)')
  runBuild()
  log('verify: build ok')

  const registered = checkRegistry()
  const targets = REFERENCE_SAMPLE
    ? [REFERENCE_SAMPLE.slug, ...registered.filter((slug) => slug !== REFERENCE_SAMPLE.slug)]
    : registered
  if (targets.length === 0) {
    log('verify: no presentations registered; build verified, nothing to render')
    return 'PASS: build succeeded; no presentations are registered to render.'
  }
  log(`verify: sample registration ok (${targets.join(', ')})`)

  active.browser = await provisionBrowser()

  const port = await freePort()
  active.preview = startPreview(port)
  await waitForPreview(active.preview)
  const baseUrl = `http://127.0.0.1:${port}`
  log(`verify: preview: ${baseUrl}`)

  const summaries = []
  for (const slug of targets) {
    const expected = REFERENCE_SAMPLE?.slug === slug ? REFERENCE_SAMPLE : null
    log(`verify: render ${slug}`)
    const count = await renderPresentation(active.browser, baseUrl, slug, expected, log)
    summaries.push(`${slug} (${count} steps)`)
  }
  return `PASS: ${summaries.join(', ')} rendered through every step with no console or page errors.`
}

function firstLine(error) {
  return String(error?.message ?? error).split('\n')[0]
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}

async function run() {
  let code = 0
  try {
    const summary = await main()
    console.log(summary)
  } catch (error) {
    code = 1
    if (error instanceof VerifyFailure) {
      console.error(formatFailure(error.phase, error.message))
    } else {
      console.error(formatFailure('internal', error?.stack ?? String(error)))
    }
  } finally {
    await cleanup()
  }
  return code
}

const isEntryPoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (isEntryPoint) {
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      cleanup().finally(() => process.exit(130))
    })
  }
  process.exitCode = await run()
}
