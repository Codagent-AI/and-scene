#!/usr/bin/env node
// Project-local visual inspection helper.
//
// Captures one settled screenshot per presentation step from a production preview
// and prints advisory diagnostics. Warnings never change the exit code; only
// capture or runtime failures (unknown slug, no preview, browser crash, build
// failure) exit non-zero.
//
// This file is byte-copied to the bootstrap template. It may import only Node
// builtins and `playwright`, and it runs main() only when executed directly.

import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { realpathSync } from 'node:fs'
import { mkdir, readdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ---- thresholds and defaults (exported so tests pin the rules) ----------------

export const DEFAULT_VIEWPORT = Object.freeze({ width: 1440, height: 900 })
export const DEFAULT_SETTLE_MS = 1200
/** Two boxes overlap only when the intersection is larger than this, in both axes. */
export const OVERLAP_MIN_PX = 2
/** Attribution text below this computed font size is reported as too small. */
export const ATTRIBUTION_MIN_FONT_PX = 11
/** Browser-default link colour; reported only together with an underline. */
export const DEFAULT_LINK_COLOR = 'rgb(0, 0, 238)'
/** First family of a computed font-family list that counts as the browser-default serif. */
export const DEFAULT_SERIF_FAMILIES = Object.freeze(['times new roman', 'times', 'serif'])

const BORDER_SIDES = ['Top', 'Right', 'Bottom', 'Left']
/** Computed properties compared between an active item and its inactive siblings. */
export const ACTIVE_CHROME_PROPERTIES = Object.freeze([
  'color',
  'backgroundColor',
  ...BORDER_SIDES.flatMap((s) => [`border${s}Color`, `border${s}Width`, `border${s}Style`]),
  'outlineColor',
  'outlineWidth',
  'outlineStyle',
  'boxShadow',
  'opacity',
  'fontWeight',
  'textDecorationLine',
  'textDecorationStyle',
  'textDecorationColor',
  'transform',
])
export const ATTRIBUTION_PROPERTIES = Object.freeze(['fontSize', 'fontFamily', 'color', 'textDecorationLine'])

/** Elements that count as presentation chrome even when they hold no text of their own. */
export const CHROME_SELECTOR = [
  '[data-presentation-progress-item]',
  '[data-presentation-toc-item]',
  '[data-presentation-prev]',
  '[data-presentation-next]',
  '[data-presentation-mode-toggle]',
  '[data-presentation-title]',
  '[data-presentation-caption]',
  '[data-presentation-deck-title]',
  '[data-presentation-marker]',
  '[data-presentation-attribution]',
].join(', ')

const PREVIEW_READY_MS = 30_000
const RENDER_TIMEOUT_MS = 15_000
const TRANSITION_TIMEOUT_MS = 5_000
const USAGE = `usage: npm run inspect -- <slug> [--viewport WxH] [--settle <ms>] [--no-build] [--out dir]

  --viewport WxH   browser viewport in CSS px (default ${DEFAULT_VIEWPORT.width}x${DEFAULT_VIEWPORT.height})
  --settle <ms>    wait after each step transition before capturing (default ${DEFAULT_SETTLE_MS})
  --no-build       skip "npm run build" and serve the existing dist/
  --out dir        artifact root (default .inspection); files go to <dir>/<slug>/step-NN.png`

// ---- errors ----------------------------------------------------------------------

export class UsageError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UsageError'
  }
}

export class InspectError extends Error {
  constructor(phase, message) {
    super(message)
    this.name = 'InspectError'
    this.phase = phase
  }
}

// ---- argument parsing (pure) -----------------------------------------------------

export function parseViewport(value) {
  const match = /^(\d+)[xX](\d+)$/.exec(String(value ?? ''))
  if (!match) throw new UsageError(`invalid --viewport "${value}": expected WxH, e.g. 1440x900`)
  const width = Number(match[1])
  const height = Number(match[2])
  if (width < 1 || height < 1) throw new UsageError(`invalid --viewport "${value}": dimensions must be positive`)
  return { width, height }
}

export function parseSettle(value) {
  if (!/^\d+$/.test(String(value ?? ''))) {
    throw new UsageError(`invalid --settle "${value}": expected a whole number of milliseconds`)
  }
  return Number(value)
}

export function parseArgs(argv) {
  const options = {
    slug: undefined,
    viewport: DEFAULT_VIEWPORT,
    settle: DEFAULT_SETTLE_MS,
    build: true,
    outDir: join(PROJECT_ROOT, '.inspection'),
    help: false,
  }
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') {
      options.help = true
      continue
    }
    if (arg === '--no-build') {
      options.build = false
      continue
    }
    const match = /^--(viewport|settle|out)(?:=(.*))?$/.exec(arg)
    if (match) {
      let value = match[2]
      if (value === undefined) {
        value = argv[i + 1]
        if (value === undefined || value.startsWith('--')) throw new UsageError(`--${match[1]} requires a value`)
        i++
      }
      if (match[1] === 'viewport') options.viewport = parseViewport(value)
      else if (match[1] === 'settle') options.settle = parseSettle(value)
      else options.outDir = resolve(value)
      continue
    }
    if (arg.startsWith('-')) throw new UsageError(`unknown option "${arg}"`)
    positional.push(arg)
  }
  if (options.help) return options
  if (positional.length !== 1) throw new UsageError('expected exactly one presentation slug')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(positional[0])) {
    throw new UsageError(`invalid slug "${positional[0]}": use lowercase letters, digits and hyphens`)
  }
  options.slug = positional[0]
  return options
}

// ---- geometry and style comparators (pure) ---------------------------------------

/** Overlap extent on each axis; negative values mean the boxes are apart. */
export function overlapAmount(a, b) {
  return {
    x: Math.min(a.right, b.right) - Math.max(a.left, b.left),
    y: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
  }
}

/** True only when the intersection exceeds minPx in both axes. */
export function rectsOverlap(a, b, minPx = OVERLAP_MIN_PX) {
  const { x, y } = overlapAmount(a, b)
  return x > minPx && y > minPx
}

/**
 * Items are {desc, rect, hidden, allowOverlap}. Hidden items are ignored, and a pair is
 * skipped when either member sits inside a data-presentation-allow-overlap subtree.
 */
export function findOverlaps(items, minPx = OVERLAP_MIN_PX) {
  const live = items.filter((item) => !item.hidden)
  const pairs = []
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]
      if (a.allowOverlap || b.allowOverlap) continue
      if (rectsOverlap(a.rect, b.rect, minPx)) pairs.push({ a: a.desc, b: b.desc, ...overlapAmount(a.rect, b.rect) })
    }
  }
  return pairs
}

/** Names of the keys whose values differ between two computed-style records. */
export function styleDifferences(a, b, keys = ACTIVE_CHROME_PROPERTIES) {
  return keys.filter((key) => a[key] !== b[key])
}

/** One message per visible active item that matches a visible inactive sibling. */
export function indistinctActiveWarnings(groups) {
  const messages = []
  for (const items of groups) {
    const visible = items.filter((item) => !item.hidden)
    const inactive = visible.filter((item) => !item.active)
    for (const active of visible.filter((item) => item.active)) {
      const twin = inactive.find((item) => styleDifferences(active.styles, item.styles).length === 0)
      if (twin) {
        messages.push(
          `${describeElement(active.desc)} is visually indistinct from inactive ${describeElement(twin.desc)}: ` +
            'no difference in computed color, background, border, outline, box-shadow, opacity, font-weight, ' +
            'text-decoration or transform',
        )
      }
    }
  }
  return messages
}

export function isDefaultLinkLook(styles) {
  return styles.color === DEFAULT_LINK_COLOR && /\bunderline\b/.test(String(styles.textDecorationLine ?? ''))
}

export function isDefaultSerif(fontFamily) {
  const first = String(fontFamily ?? '')
    .split(',')[0]
    .trim()
    .replace(/^["']|["']$/g, '')
    .toLowerCase()
  return DEFAULT_SERIF_FAMILIES.includes(first)
}

/** Attribution reasons, each prefixed with the styling hook; empty when the attribution is polished. */
export function attributionWarnings(attribution) {
  const hook = 'data-presentation-attribution'
  if (!attribution || !attribution.present) {
    return [`${hook}: missing; add a visible [${hook}] element`]
  }
  const messages = []
  const size = Number.parseFloat(attribution.styles.fontSize)
  if (!(size >= ATTRIBUTION_MIN_FONT_PX)) {
    messages.push(`${hook}: font-size ${attribution.styles.fontSize} is below ${ATTRIBUTION_MIN_FONT_PX}px`)
  }
  if (isDefaultLinkLook(attribution.styles)) {
    messages.push(`${hook}: browser-default link styling (${DEFAULT_LINK_COLOR} with underline)`)
  }
  if (isDefaultSerif(attribution.styles.fontFamily)) {
    messages.push(`${hook}: browser-default serif font`)
  }
  return messages
}

export function describeElement(desc) {
  const attrs = desc.attrs.length ? ` ${desc.attrs.join(' ')}` : ''
  const text = desc.text ? ` "${desc.text}"` : ''
  return `<${desc.tag}${attrs}>${text}`
}

/** Turns one in-page snapshot into advisory diagnostics. */
export function diagnoseSnapshot(snapshot) {
  const diagnostics = []
  for (const pair of findOverlaps(snapshot.overlapItems ?? [])) {
    const x = Math.max(0, pair.x).toFixed(1)
    const y = Math.max(0, pair.y).toFixed(1)
    diagnostics.push({
      kind: 'overlap',
      message: `${describeElement(pair.a)} overlaps ${describeElement(pair.b)} (${x} x ${y} px)`,
    })
  }
  for (const message of indistinctActiveWarnings(snapshot.chromeGroups ?? [])) {
    diagnostics.push({ kind: 'indistinct-active', message })
  }
  for (const message of attributionWarnings(snapshot.attribution)) {
    diagnostics.push({ kind: 'attribution', message })
  }
  return diagnostics
}

export function formatWarning(step, kind, message) {
  return `warning: step ${step}: ${kind}: ${message}`
}

// ---- in-page snapshot ------------------------------------------------------------

/**
 * Runs inside the browser through page.evaluate, so it must stay self-contained.
 * It gathers raw geometry and computed styles; all rule decisions are made in Node.
 */
export function collectSnapshot({ chromeSelector, styleKeys, attributionKeys }) {
  const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'])
  const isHidden = (el) => {
    for (let node = el; node instanceof Element; node = node.parentElement) {
      const style = window.getComputedStyle(node)
      if (style.display === 'none' || Number(style.opacity) === 0) return true
    }
    if (window.getComputedStyle(el).visibility !== 'visible') return true
    const box = el.getBoundingClientRect()
    return box.width <= 0 || box.height <= 0
  }
  const describe = (el) => ({
    tag: el.tagName.toLowerCase(),
    attrs: [...el.attributes]
      .filter((a) => a.name.startsWith('data-presentation-') || a.name === 'aria-label' || (a.name === 'class' && a.value))
      .map((a) => (a.value === '' ? a.name : `${a.name}="${a.value}"`)),
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
  })
  const pick = (style, keys) => Object.fromEntries(keys.map((key) => [key, style[key]]))
  const rect = (box) => ({ left: box.left, top: box.top, right: box.right, bottom: box.bottom })
  const hasOwnText = (el) =>
    [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '')

  // Leaf candidates: elements with their own text or chrome hooks, excluding ancestors of other candidates.
  const candidates = [...document.body.querySelectorAll('*')].filter(
    (el) => !SKIPPED_TAGS.has(el.tagName) && (hasOwnText(el) || el.matches(chromeSelector)),
  )
  const candidateSet = new Set(candidates)
  const hasCandidateDescendant = new Set()
  for (const el of candidates) {
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (candidateSet.has(p)) hasCandidateDescendant.add(p)
    }
  }
  const overlapItems = candidates
    .filter((el) => !hasCandidateDescendant.has(el))
    .map((el) => ({
      desc: describe(el),
      rect: rect(el.getBoundingClientRect()),
      hidden: isHidden(el),
      allowOverlap: el.closest('[data-presentation-allow-overlap]') !== null,
    }))

  // Progress and table-of-contents items, grouped by their container.
  const groups = new Map()
  for (const el of document.querySelectorAll('[data-presentation-progress-item], [data-presentation-toc-item]')) {
    const list = groups.get(el.parentElement) ?? []
    list.push({
      desc: describe(el),
      active: el.getAttribute('data-presentation-active') === 'true',
      hidden: isHidden(el),
      styles: pick(window.getComputedStyle(el), styleKeys),
    })
    groups.set(el.parentElement, list)
  }

  const attributionEl = document.querySelector('[data-presentation-attribution]')
  const attribution =
    attributionEl && !isHidden(attributionEl)
      ? {
          present: true,
          desc: describe(attributionEl),
          styles: pick(window.getComputedStyle(attributionEl), attributionKeys),
        }
      : { present: false, desc: null, styles: null }

  return { overlapItems, chromeGroups: [...groups.values()], attribution }
}

// ---- process helpers -------------------------------------------------------------

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

function freePort() {
  return new Promise((done, fail) => {
    const server = createServer()
    server.on('error', fail)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => done(port))
    })
  })
}

function runBuild() {
  return new Promise((done, fail) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const child = spawn(npm, ['run', 'build'], { cwd: PROJECT_ROOT, stdio: 'inherit' })
    child.on('error', fail)
    child.on('exit', (code) => {
      if (code === 0) done()
      else fail(new InspectError('build', `npm run build exited with code ${code}`))
    })
  })
}

function startPreview(port) {
  const require = createRequire(join(PROJECT_ROOT, 'package.json'))
  const viteBin = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: PROJECT_ROOT, detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  const collect = (chunk) => {
    output = (output + chunk).slice(-4000)
  }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  return { child, tail: () => output.trim() }
}

async function waitForPreview(port, preview) {
  const deadline = Date.now() + PREVIEW_READY_MS
  while (Date.now() < deadline) {
    if (preview.child.exitCode !== null || preview.child.signalCode !== null) {
      throw new InspectError('preview', `vite preview exited early: ${preview.tail()}`)
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`)
      await response.arrayBuffer()
      // A foreign server could answer on the port while our preview already died (port race).
      if (preview.child.exitCode !== null || preview.child.signalCode !== null) {
        throw new InspectError('preview', `vite preview exited while 127.0.0.1:${port} answered: ${preview.tail()}`)
      }
      return
    } catch (error) {
      if (error instanceof InspectError) throw error
      await sleep(250)
    }
  }
  throw new InspectError('preview', `vite preview did not become ready on 127.0.0.1:${port}`)
}

async function stopPreview(preview) {
  if (!preview) return
  const { child } = preview
  if (child.exitCode !== null || child.signalCode !== null) return
  const signalGroup = (signal) => {
    try {
      process.kill(-child.pid, signal)
    } catch {
      // Group already gone.
    }
  }
  signalGroup('SIGTERM')
  const exited = once(child, 'exit').then(() => true)
  const timedOut = sleep(5000).then(() => false)
  if (!(await Promise.race([exited, timedOut]))) signalGroup('SIGKILL')
}

// ---- capture ---------------------------------------------------------------------

async function captureSteps(port, options) {
  const url = `http://127.0.0.1:${port}/${options.slug}`
  const dir = join(options.outDir, options.slug)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: options.viewport })
    await page.goto(url, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-count], [data-landing]', { timeout: RENDER_TIMEOUT_MS })
    } catch {
      throw new InspectError('render', `timed out rendering ${url}`)
    }
    const rawCount = await page.evaluate(
      () => document.querySelector('[data-step-count]')?.getAttribute('data-step-count') ?? null,
    )
    const count = Number(rawCount)
    if (rawCount === null || !Number.isInteger(count) || count < 1) {
      throw new InspectError('render', `no registered presentation rendered at ${url} (unknown slug?)`)
    }

    await mkdir(dir, { recursive: true })
    for (const name of await readdir(dir)) {
      if (/^step-\d+\.png$/.test(name)) await rm(join(dir, name))
    }

    let warnings = 0
    for (let index = 0; index < count; index++) {
      try {
        await page.waitForSelector(`[data-step-index="${index}"]`, {
          state: 'attached',
          timeout: TRANSITION_TIMEOUT_MS,
        })
      } catch {
        throw new InspectError('transition', `step ${index + 1} of ${count} was not reached (data-step-index=${index})`)
      }
      await page.waitForTimeout(options.settle)
      await page.screenshot({ path: join(dir, `step-${String(index + 1).padStart(2, '0')}.png`) })
      const snapshot = await page.evaluate(collectSnapshot, {
        chromeSelector: CHROME_SELECTOR,
        styleKeys: [...ACTIVE_CHROME_PROPERTIES],
        attributionKeys: [...ATTRIBUTION_PROPERTIES],
      })
      for (const diagnostic of diagnoseSnapshot(snapshot)) {
        console.log(formatWarning(index + 1, diagnostic.kind, diagnostic.message))
        warnings++
      }
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    return { steps: count, warnings, dir }
  } finally {
    await browser.close()
  }
}

export async function main(argv = process.argv.slice(2)) {
  let options
  try {
    options = parseArgs(argv)
  } catch (err) {
    if (!(err instanceof UsageError)) throw err
    console.error(`inspect-presentation: ${err.message}`)
    console.error(USAGE)
    return 2
  }
  if (options.help) {
    console.log(USAGE)
    return 0
  }

  let preview
  try {
    if (options.build) await runBuild()
    const port = await freePort()
    preview = startPreview(port)
    await waitForPreview(port, preview)
    const result = await captureSteps(port, options)
    console.log(
      `inspect-presentation: captured ${result.steps} step(s) to ${result.dir}; ` +
        `${result.warnings} advisory warning(s) (warnings do not fail the run)`,
    )
    return 0
  } catch (err) {
    if (err instanceof InspectError) {
      console.error(`inspect-presentation: ${err.phase} failed: ${err.message}`)
    } else {
      console.error(`inspect-presentation: runtime failed: ${err?.stack ?? err}`)
    }
    return 1
  } finally {
    await stopPreview(preview)
  }
}

const invokedDirectly = (() => {
  try {
    return process.argv[1] !== undefined && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
  } catch {
    return false
  }
})()

if (invokedDirectly) {
  main().then((code) => {
    process.exitCode = code
  })
}
