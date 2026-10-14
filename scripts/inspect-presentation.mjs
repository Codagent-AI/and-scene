#!/usr/bin/env node
// Project-local screenshot and visual-diagnostics helper.
//
//   npm run inspect -- <slug> [options]     (run `npm run inspect -- --help` for the full list)
//
// Captures one settled screenshot per step of a registered presentation from a production
// preview (vite preview on 127.0.0.1), and prints advisory warnings. Screenshots and warnings
// are inspection evidence for a human or agent visual review, not a pass/fail gate: the exit
// code is 0 unless the helper itself cannot run or cannot capture.
//
// Allow-overlap marker: place `data-presentation-allow-overlap` on an element to exempt the text
// and chrome inside it from overlap warnings. Use it only for a readable, intentional overlap.
// The kit never applies this marker itself.
//
// Settle: after each step change the helper waits `--settle` ms (default 1800, or
// INSPECT_SETTLE_MS) since the last `data-step-index` change before capturing. The default
// clears the kit's transition windows: LAYOUT_T 0.6s, then ENTER_DELAY 0.6s + ENTER_T 0.4s.
//
// Paths resolve from the project root (the parent of this scripts/ directory unless --root is
// given), never from the caller's working directory.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { get } from 'node:http'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VITE_BIN = join(PROJECT_ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const ARTIFACT_DIR_NAME = '.presentation-inspect'
const DESKTOP_VIEWPORT = { width: 1280, height: 800 }
const NARROW_VIEWPORT = { width: 390, height: 844 }
// Files whose changes make an existing dist/ stale. Missing entries are skipped.
const SOURCE_ENTRIES = [
  'src',
  'public',
  'index.html',
  'package.json',
  'vite.config.ts',
  'vite.config.js',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
]

// Diagnostic thresholds. Advisory only; tune here rather than in the presentation.
export const DEFAULT_SETTLE_MS = 1_800
export const MIN_FONT_SIZE_PX = 12
export const MIN_TAP_SIZE_PX = 20
// Boxes must intersect by more than this many CSS pixels in both directions to count as overlap.
export const MIN_OVERLAP_PX = 2
export const OVERLAP_MARKER = 'data-presentation-allow-overlap'
export const ATTRIBUTION_HOOK = 'data-presentation-attribution'

// Computed style properties that make an active control distinguishable from an inactive one.
export const ACTIVE_STYLE_PROPERTIES = [
  'color',
  'background-color',
  'background-image',
  'border-top-color',
  'border-top-style',
  'border-top-width',
  'border-left-color',
  'border-left-style',
  'border-left-width',
  'box-shadow',
  'font-size',
  'font-weight',
  'height',
  'opacity',
  'outline-style',
  'text-decoration-line',
  'transform',
  'width',
]

const PREVIEW_READY_TIMEOUT_MS = 30_000
const PAGE_READY_TIMEOUT_MS = 15_000
const TRANSITION_TIMEOUT_MS = 3_000
const BUILD_TIMEOUT_MS = 600_000
const POLL_MS = 50

const HELP = `Usage: npm run inspect -- <slug> [options]

Captures one settled screenshot per step of a registered presentation from a production
preview, and prints advisory warnings. Screenshots and warnings are inspection evidence for
visual review, not a pass/fail gate: the exit code is 0 unless the helper itself cannot run.

Options:
  --viewport WxH   Viewport size (default ${DESKTOP_VIEWPORT.width}x${DESKTOP_VIEWPORT.height})
  --narrow         Shorthand for --viewport ${NARROW_VIEWPORT.width}x${NARROW_VIEWPORT.height}
  --settle MS      Wait this long after each step change before capturing. Default ${DEFAULT_SETTLE_MS}.
                   Also settable with INSPECT_SETTLE_MS; the flag wins. Must exceed the kit's
                   transitions (LAYOUT_T 0.6s, then ENTER_DELAY 0.6s + ENTER_T 0.4s).
  --out DIR        Artifact root (default <root>/${ARTIFACT_DIR_NAME})
  --root DIR       Project to inspect (default: the project this script lives in)
  --base-url URL   Inspect an already-running preview instead of building and starting one
  --rebuild        Rebuild dist/ even when it looks up to date
  --no-build       Use the existing dist/ without checking it
  -h, --help       Show this help

Allow-overlap marker:
  Add data-presentation-allow-overlap to an element to exempt the text and chrome inside it
  from overlap warnings, e.g. <div data-presentation-allow-overlap> around an intentional,
  readable overlap. The kit does not apply this marker by default.

Warnings (each names the step index and the elements or chrome involved):
  overlap        visible text or chrome intersects other visible text or chrome without the marker
  active-chrome  the active progress indicator or table-of-contents entry looks like an inactive one
  attribution    the "made by" link is browser-default styled, under ${MIN_FONT_SIZE_PX}px, or under ${MIN_TAP_SIZE_PX}px tall;
                 style it through [${ATTRIBUTION_HOOK}]
  runtime        the page logged a console error or an uncaught exception

Output:
  <out>/<slug>/step-NN.png              desktop viewport
  <out>/<slug>/<WxH>/step-NN.png        any other viewport
  <out>/<slug>/manifest.json            per-step settle timing and warnings
`

// ── Pure helpers (exported for unit tests) ───────────────────────────────────

export class UsageError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UsageError'
  }
}

export class HelperFailure extends Error {
  constructor(phase, message) {
    super(message)
    this.name = 'HelperFailure'
    this.phase = phase
  }
}

function parseSettle(text, label) {
  if (!/^\d+$/.test(text)) {
    throw new UsageError(`${label} expects a non-negative whole number of milliseconds, got "${text}"`)
  }
  return Number(text)
}

/** Parses "WIDTHxHEIGHT" into positive integer pixel sizes. */
export function parseViewport(text) {
  const match = /^(\d+)x(\d+)$/.exec(text ?? '')
  if (!match || Number(match[1]) < 1 || Number(match[2]) < 1) {
    throw new UsageError(`--viewport expects WIDTHxHEIGHT, got "${text}"`)
  }
  return { width: Number(match[1]), height: Number(match[2]) }
}

/** Parses argv and the environment. Throws UsageError on bad input. */
export function parseArgs(argv, env = {}) {
  const options = {
    slug: undefined,
    root: undefined,
    baseUrl: undefined,
    out: undefined,
    viewport: DESKTOP_VIEWPORT,
    settleMs: env.INSPECT_SETTLE_MS === undefined ? DEFAULT_SETTLE_MS : parseSettle(env.INSPECT_SETTLE_MS, 'INSPECT_SETTLE_MS'),
    rebuild: false,
    noBuild: false,
    help: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const value = () => {
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) throw new UsageError(`${arg} needs a value`)
      i += 1
      return next
    }
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true
        break
      case '--root':
        options.root = value()
        break
      case '--base-url':
        options.baseUrl = value()
        break
      case '--out':
        options.out = value()
        break
      case '--viewport':
        options.viewport = parseViewport(value())
        break
      case '--narrow':
        options.viewport = NARROW_VIEWPORT
        break
      case '--settle':
        options.settleMs = parseSettle(value(), '--settle')
        break
      case '--rebuild':
        options.rebuild = true
        break
      case '--no-build':
        options.noBuild = true
        break
      default:
        if (arg.startsWith('-')) throw new UsageError(`unknown option ${arg}`)
        if (options.slug !== undefined) throw new UsageError(`unexpected argument "${arg}"`)
        options.slug = arg
    }
  }

  if (!options.help && !options.slug) {
    throw new UsageError('a presentation slug is required, e.g. npm run inspect -- how-to-make-a-presentation')
  }
  return options
}

/** The shared area of two boxes, or null when they do not intersect. */
export function intersection(a, b) {
  const left = Math.max(a.left, b.left)
  const top = Math.max(a.top, b.top)
  const right = Math.min(a.right, b.right)
  const bottom = Math.min(a.bottom, b.bottom)
  return right > left && bottom > top ? { left, top, right, bottom } : null
}

/** True when two boxes overlap by more than MIN_OVERLAP_PX in both directions. */
export function overlapsSignificantly(a, b) {
  const shared = intersection(a, b)
  return shared !== null && shared.right - shared.left > MIN_OVERLAP_PX && shared.bottom - shared.top > MIN_OVERLAP_PX
}

/** True when the active control's computed style matches any inactive sibling's. */
export function indistinctFrom(activeSignature, inactiveSignatures) {
  return inactiveSignatures.some((signature) => signature === activeSignature)
}

/**
 * Size and default-look findings for the attribution link. Empty when it is deliberately
 * styled and readable. Defaults come from an unstyled link measured in the same page.
 */
export function attributionFindings({ color, textDecorationLine, fontSizePx, tapHeightPx, defaults }) {
  const findings = []
  if (color === defaults.color && textDecorationLine === defaults.textDecorationLine && fontSizePx === defaults.fontSizePx) {
    findings.push('browser-default')
  }
  if (fontSizePx < MIN_FONT_SIZE_PX) findings.push('too-small')
  if (tapHeightPx < MIN_TAP_SIZE_PX) findings.push('undersized')
  return findings
}

/** True when there is no build, or when any source file is newer than the build. */
export function isBuildStale(sourceMtimes, distMtime) {
  if (distMtime === null) return true
  return sourceMtimes.some((mtime) => mtime > distMtime)
}

/** One greppable advisory line that names the step. */
export function formatWarning({ kind, index, stepCount, detail }) {
  return `warning [${kind}] step index ${index} (step ${index + 1} of ${stepCount}): ${detail}`
}

const ATTRIBUTION_MESSAGES = {
  'browser-default': `attribution link uses the browser-default color, underline, and font size; style it through [${ATTRIBUTION_HOOK}]`,
  'too-small': `attribution link text is under ${MIN_FONT_SIZE_PX}px; style it through [${ATTRIBUTION_HOOK}]`,
  undersized: `attribution link is under ${MIN_TAP_SIZE_PX}px tall; give it padding through [${ATTRIBUTION_HOOK}]`,
}

/**
 * Turns the raw measurements from collectStepDiagnostics into findings. Pure, so the same
 * rules apply however the browser reports the numbers.
 */
export function diagnosticsToFindings(diagnostics) {
  const findings = []

  for (const [i, j] of diagnostics.pairs) {
    const a = diagnostics.candidates[i]
    const b = diagnostics.candidates[j]
    const colliding = a.rects.some((ra) => b.rects.some((rb) => overlapsSignificantly(ra, rb)))
    if (colliding) {
      findings.push({
        kind: 'overlap',
        detail: `${a.desc} overlaps ${b.desc}; if the overlap is intentional and readable, wrap it in an element with ${OVERLAP_MARKER}`,
      })
    }
  }

  for (const group of diagnostics.groups) {
    const active = group.entries.find((entry) => entry.active)
    const inactive = group.entries.filter((entry) => !entry.active)
    if (!active || inactive.length === 0) continue
    if (!indistinctFrom(active.signature, inactive.map((entry) => entry.signature))) continue
    const twin = inactive.find((entry) => entry.signature === active.signature)
    findings.push({
      kind: 'active-chrome',
      detail: `${group.name} "${active.label}" [${group.hook}] looks the same as "${twin.label}"; give [data-presentation-active='true'] a distinct color, background, border, weight, or size`,
    })
  }

  if (diagnostics.attribution) {
    const attribution = diagnostics.attribution
    for (const reason of attributionFindings(attribution)) {
      findings.push({ kind: 'attribution', detail: ATTRIBUTION_MESSAGES[reason] })
    }
  }

  return findings
}

/** Modification times of every source file that can change dist/. */
export function sourceMtimes(root) {
  const times = []
  const walk = (path) => {
    const info = statSync(path)
    if (info.isDirectory()) {
      for (const name of readdirSync(path)) walk(join(path, name))
    } else {
      times.push(info.mtimeMs)
    }
  }
  for (const entry of SOURCE_ENTRIES) {
    const path = join(root, entry)
    if (existsSync(path)) walk(path)
  }
  return times
}

// ── Build and preview ────────────────────────────────────────────────────────

function lastLines(text, count = 25) {
  return text.trim().split('\n').slice(-count).join('\n')
}

function firstLine(error) {
  return String(error?.message ?? error).split('\n')[0]
}

function runBuild(root, log) {
  const pkgPath = join(root, 'package.json')
  const hasBuildScript =
    existsSync(pkgPath) && JSON.parse(readFileSync(pkgPath, 'utf8')).scripts?.build !== undefined
  const command = hasBuildScript
    ? spawnSync(NPM, ['run', 'build'], { cwd: root, encoding: 'utf8', timeout: BUILD_TIMEOUT_MS })
    : spawnSync(process.execPath, [VITE_BIN, 'build'], { cwd: root, encoding: 'utf8', timeout: BUILD_TIMEOUT_MS })
  if (command.status !== 0) {
    const output = `${command.stdout ?? ''}${command.stderr ?? ''}`
    throw new HelperFailure('build', `build exited ${command.status ?? command.signal}\n${lastLines(output)}`)
  }
  log('inspect: build ok')
}

function ensureBuild(root, options, log) {
  const indexHtml = join(root, 'dist', 'index.html')
  const builtAt = existsSync(indexHtml) ? statSync(indexHtml).mtimeMs : null

  if (options.noBuild) {
    if (builtAt === null) throw new HelperFailure('build', `no build at ${join(root, 'dist')}; run without --no-build`)
    log('inspect: reusing dist/ (--no-build)')
    return
  }
  if (!options.rebuild && !isBuildStale(sourceMtimes(root), builtAt)) {
    log('inspect: reusing up-to-date dist/')
    return
  }
  log(builtAt === null ? 'inspect: building (no dist/ yet)' : 'inspect: rebuilding (dist/ is stale or --rebuild)')
  runBuild(root, log)
}

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

function startPreview(root, port) {
  if (!existsSync(VITE_BIN)) throw new HelperFailure('preview', 'vite is not installed; run npm ci first')
  const child = spawn(
    process.execPath,
    [VITE_BIN, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: root,
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

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}

async function waitForPreview(preview) {
  const url = `http://127.0.0.1:${preview.port}/`
  const deadline = Date.now() + PREVIEW_READY_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (preview.child.exitCode !== null || preview.child.signalCode !== null) {
      throw new HelperFailure('preview', `vite preview exited before it was ready\n${lastLines(preview.output)}`)
    }
    if (await probe(url)) return
    await delay(250)
  }
  throw new HelperFailure('preview', `vite preview did not answer at ${url} within ${PREVIEW_READY_TIMEOUT_MS}ms`)
}

function signalPreview(child, signal) {
  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch {
    // The group is already gone.
  }
}

async function stopPreview(preview) {
  if (!preview) return
  const { child } = preview
  if (child.exitCode !== null || child.signalCode !== null) return
  const exited = new Promise((resolveExit) => child.once('exit', resolveExit))
  signalPreview(child, 'SIGTERM')
  let timer
  const grace = new Promise((resolveGrace) => {
    timer = setTimeout(resolveGrace, 5_000)
  })
  await Promise.race([exited, grace])
  clearTimeout(timer)
  if (child.exitCode === null && child.signalCode === null) {
    signalPreview(child, 'SIGKILL')
    await exited
  }
}

async function launchBrowser() {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch (error) {
    throw new HelperFailure('browser', `playwright is not installed: ${firstLine(error)}`)
  }
  try {
    return await chromium.launch({ headless: true })
  } catch (error) {
    throw new HelperFailure(
      'browser',
      `Playwright Chromium cannot be launched. Run "npx playwright install chromium" and retry. (${firstLine(error)})`,
    )
  }
}

// ── In-page measurement ──────────────────────────────────────────────────────
// Everything below runs inside the page through page.evaluate, so each function must be
// self-contained. The pure rules live in diagnosticsToFindings.

/** Starts the clock that the settle wait reads: the time since the last step-index change. */
function installSettleClock() {
  window.__inspectLastChange = performance.now()
  const root = document.querySelector('[data-presentation-root]')
  new MutationObserver(() => {
    window.__inspectLastChange = performance.now()
  }).observe(root, { attributes: true, attributeFilter: ['data-step-index'] })
}

/** Reads the active step's overlap candidates, active chrome, and attribution. */
function collectStepDiagnostics(config) {
  const root = document.querySelector('[data-presentation-root]')
  const CONTROLS = `button, a[href], input, select, textarea, [data-presentation-progress-item], [${config.attributionHook}]`

  const hasOwnText = (el) =>
    [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '')
  const textOf = (el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()
  const isVisible = (el) => !el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true })

  const describe = (el) => {
    const hook = [...el.attributes].find((attr) => attr.name.startsWith('data-presentation-'))
    const hookLabel = hook ? (hook.value ? `${hook.name}="${hook.value}"` : hook.name) : ''
    const text = textOf(el).slice(0, 40)
    return `${text ? `"${text}" ` : ''}<${el.tagName.toLowerCase()}${hookLabel ? ` ${hookLabel}` : ''}>`
  }

  // A box is only as visible as the overflow-hiding ancestors around it allow.
  const clipped = (el, box) => {
    let rect = { left: box.left, top: box.top, right: box.right, bottom: box.bottom }
    for (let node = el.parentElement; node && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.overflowX === 'visible' && style.overflowY === 'visible') continue
      const clip = node.getBoundingClientRect()
      rect = {
        left: Math.max(rect.left, clip.left),
        top: Math.max(rect.top, clip.top),
        right: Math.min(rect.right, clip.right),
        bottom: Math.min(rect.bottom, clip.bottom),
      }
    }
    return rect.right > rect.left && rect.bottom > rect.top ? rect : null
  }

  // Text is measured per text run, not per element box, so a label placed in the empty part of a box is not a collision.
  const boxesOf = (el) => {
    if (el.matches(CONTROLS)) return [el.getBoundingClientRect()]
    const runs = []
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || node.textContent.trim() === '') continue
      const range = document.createRange()
      range.selectNodeContents(node)
      runs.push(...range.getClientRects())
    }
    return runs
  }

  const candidates = []
  for (const el of root.querySelectorAll('*')) {
    if (!hasOwnText(el) && !el.matches(CONTROLS)) continue
    if (!isVisible(el)) continue
    const rects = boxesOf(el)
      .map((box) => clipped(el, box))
      .filter((rect) => rect !== null)
    if (rects.length === 0) continue
    candidates.push({ el, desc: describe(el), rects, exempt: el.closest(`[${config.allowMarker}]`) !== null })
  }

  // Pairs that can collide: neither contains the other, and neither sits inside an allow-overlap subtree.
  const pairs = []
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i]
      const b = candidates[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      if (a.exempt || b.exempt) continue
      pairs.push([i, j])
    }
  }

  const signature = (el) => {
    const style = getComputedStyle(el)
    return config.activeProperties.map((name) => `${name}:${style.getPropertyValue(name)}`).join(';')
  }
  const entryOf = (el) => ({
    label: el.getAttribute('aria-label') || textOf(el),
    active: el.getAttribute('data-presentation-active') === 'true',
    signature: signature(el),
  })
  const groups = [
    {
      name: 'progress indicator',
      hook: 'data-presentation-progress-item',
      entries: [...root.querySelectorAll('[data-presentation-progress-item]')].map(entryOf),
    },
    {
      name: 'table-of-contents entry',
      hook: 'data-presentation-toc-entry',
      entries: [...root.querySelectorAll('[data-presentation-toc-entry]')].map(entryOf),
    },
  ]

  const attributionEl = root.querySelector(`[${config.attributionHook}]`)
  let attribution = null
  if (attributionEl) {
    // An unstyled link in a reset container gives the browser's own color, underline, and size.
    const probeHost = document.createElement('div')
    probeHost.style.all = 'initial'
    const probeLink = document.createElement('a')
    probeLink.href = '#'
    probeLink.textContent = 'probe'
    probeHost.appendChild(probeLink)
    document.body.appendChild(probeHost)
    const defaults = getComputedStyle(probeLink)
    const attributionStyle = getComputedStyle(attributionEl)
    attribution = {
      color: attributionStyle.color,
      textDecorationLine: attributionStyle.textDecorationLine,
      fontSizePx: parseFloat(attributionStyle.fontSize),
      tapHeightPx: attributionEl.getBoundingClientRect().height,
      defaults: {
        color: defaults.color,
        textDecorationLine: defaults.textDecorationLine,
        fontSizePx: parseFloat(defaults.fontSize),
      },
    }
    probeHost.remove()
  }

  return {
    candidates: candidates.map(({ desc, rects }) => ({
      desc,
      rects: rects.map((rect) => ({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom })),
    })),
    pairs,
    groups,
    attribution,
  }
}

// ── Capture ──────────────────────────────────────────────────────────────────

function viewportDirName(viewport) {
  const isDesktop = viewport.width === DESKTOP_VIEWPORT.width && viewport.height === DESKTOP_VIEWPORT.height
  return isDesktop ? '' : `${viewport.width}x${viewport.height}`
}

function stepFileName(index) {
  return `step-${String(index).padStart(2, '0')}.png`
}

/** Removes only this helper's own files, so a sibling viewport folder is left alone. */
function clearPreviousCapture(outDir) {
  mkdirSync(outDir, { recursive: true })
  for (const name of readdirSync(outDir)) {
    if (/^step-\d+\.png$/.test(name) || name === 'manifest.json') rmSync(join(outDir, name))
  }
}

async function captureSteps(browser, { baseUrl, slug, viewport, settleMs, outDir, log }) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(`uncaught exception: ${firstLine(error)}`))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console error: ${message.text()}`)
  })

  try {
    const url = `${baseUrl}/${slug}`
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 })
    const root = page.locator('[data-presentation-root]')
    try {
      await root.waitFor({ state: 'attached', timeout: PAGE_READY_TIMEOUT_MS })
    } catch {
      throw new HelperFailure('render', `${url} did not render a presentation`)
    }

    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) {
      throw new HelperFailure('render', `${slug} reports an invalid data-step-count (${count}); expected at least 1 step`)
    }

    await page.evaluate(installSettleClock)
    clearPreviousCapture(outDir)

    const steps = []
    for (let index = 0; index < count; index += 1) {
      if (index > 0) await page.keyboard.press('ArrowRight')
      const arrived = await page
        .waitForFunction(
          (expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected),
          index,
          { timeout: TRANSITION_TIMEOUT_MS },
        )
        .then(() => true)
        .catch(() => false)
      if (!arrived) {
        const actual = await root.getAttribute('data-step-index')
        throw new HelperFailure(
          'transition',
          `${slug} did not advance to step index ${index}; data-step-index is still ${actual}`,
        )
      }

      await page.waitForFunction((ms) => performance.now() - window.__inspectLastChange >= ms, settleMs, {
        timeout: settleMs + TRANSITION_TIMEOUT_MS,
        polling: POLL_MS,
      })
      const settledMs = await page.evaluate(() => Math.round(performance.now() - window.__inspectLastChange))
      const diagnostics = await page.evaluate(collectStepDiagnostics, {
        allowMarker: OVERLAP_MARKER,
        attributionHook: ATTRIBUTION_HOOK,
        activeProperties: ACTIVE_STYLE_PROPERTIES,
      })
      const file = stepFileName(index)
      await page.screenshot({ path: join(outDir, file) })

      const findings = diagnosticsToFindings(diagnostics)
      steps.push({ index, file, settledMs, warnings: findings })
      log(`inspect: step ${index + 1}/${count} (index ${index}) captured ${file} after ${settledMs}ms settled`)
      for (const finding of findings) {
        log(formatWarning({ kind: finding.kind, index, stepCount: count, detail: finding.detail }))
      }
    }

    for (const error of runtimeErrors) log(`warning [runtime] ${error}`)
    const runtimeWarnings = runtimeErrors.map((detail) => ({ kind: 'runtime', detail }))
    writeFileSync(
      join(outDir, 'manifest.json'),
      `${JSON.stringify({ slug, viewport, settleMs, steps, runtimeWarnings }, null, 2)}\n`,
    )
    return { count, steps, runtimeWarnings }
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

async function main(options) {
  const log = (line) => console.log(line)
  const root = resolve(options.root ?? PROJECT_ROOT)
  const artifactRoot = resolve(options.out ?? join(root, ARTIFACT_DIR_NAME))
  const outDir = join(artifactRoot, options.slug, viewportDirName(options.viewport))
  const { width, height } = options.viewport
  log(`inspect: ${options.slug} at ${width}x${height}, settle ${options.settleMs}ms`)

  let baseUrl
  if (options.baseUrl) {
    baseUrl = options.baseUrl.replace(/\/+$/, '')
    log(`inspect: using base URL ${baseUrl}`)
  } else {
    ensureBuild(root, options, log)
  }

  active.browser = await launchBrowser()
  if (!baseUrl) {
    active.preview = startPreview(root, await freePort())
    await waitForPreview(active.preview)
    baseUrl = `http://127.0.0.1:${active.preview.port}`
    log(`inspect: preview ${baseUrl}`)
  }

  const { count, runtimeWarnings, steps } = await captureSteps(active.browser, {
    baseUrl,
    slug: options.slug,
    viewport: options.viewport,
    settleMs: options.settleMs,
    outDir,
    log,
  })
  const warningCount = runtimeWarnings.length + steps.reduce((total, step) => total + step.warnings.length, 0)
  return `inspect: wrote ${count} screenshots to ${outDir}; ${warningCount} advisory warning${warningCount === 1 ? '' : 's'} (review them; they are not a pass/fail result)`
}

async function run(argv) {
  let options
  try {
    options = parseArgs(argv, process.env)
  } catch (error) {
    if (!(error instanceof UsageError)) throw error
    console.error(`inspect: ${error.message}\nRun "npm run inspect -- --help" for usage.`)
    return 2
  }
  if (options.help) {
    console.log(HELP)
    return 0
  }

  let code = 0
  try {
    console.log(await main(options))
  } catch (error) {
    code = 1
    if (error instanceof HelperFailure) {
      console.error(`inspect: FAIL [${error.phase}] ${error.message}`)
    } else {
      console.error(`inspect: FAIL [internal] ${error?.stack ?? String(error)}`)
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
  process.exitCode = await run(process.argv.slice(2))
}
