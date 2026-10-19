#!/usr/bin/env node
// Project-local visual inspection helper for presentations.
//
// Usage: npm run inspect -- <slug> [--narrow] [--settle <ms>] [--no-build]
//
// Builds the app (unless --no-build), serves the production build with
// `vite preview` on 127.0.0.1, opens /<slug> in Chromium, and writes one
// screenshot per step to .inspection/<slug>/step-NN.png (or
// .inspection/<slug>/narrow/step-NN.png with --narrow). Advisory warnings are
// printed to stdout as `WARN step <n> [<kind>] ...` and never change the exit
// code. Only fatal failures (build, preview, missing route or hook, failed
// navigation or capture) exit non-zero.
//
// This file is self-contained (node builtins + playwright only) so it can be
// copied byte-identically into scaffolded projects.
import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const HOST = '127.0.0.1'
export const DESKTOP_VIEWPORT = Object.freeze({ width: 1440, height: 900 })
export const NARROW_VIEWPORT = Object.freeze({ width: 390, height: 844 })
/**
 * Default settle interval (ms) waited before every capture. Must cover
 * ENTER_DELAY + max(LAYOUT_T, ENTER_T) from src/presentation-kit/constants.ts.
 */
export const SETTLE_MS = 1800
export const ATTRIBUTION_MIN_PX = 11
export const DEFAULT_LINK_COLOR = 'rgb(0, 0, 238)'

const DEFAULT_SERIF_FAMILIES = new Set([
  'serif',
  'times',
  'times new roman',
  'tinos',
  'liberation serif',
  'nimbus roman',
  'dejavu serif',
])
const OVERLAP_EPSILON_PX = 0.5
const ACTIVE_STYLE_KEYS = [
  'color',
  'backgroundColor',
  'border',
  'boxShadow',
  'opacity',
  'fontWeight',
  'textDecorationLine',
  'transform',
]
const POLL_MS = 100
const READY_ATTEMPTS = 100
const ADVANCE_ATTEMPTS = 100
const PREVIEW_ATTEMPTS = 200
const USAGE = 'usage: npm run inspect -- <slug> [--narrow] [--settle <ms>] [--no-build]'

export class InspectError extends Error {}

export function parseArgs(argv) {
  const opts = { slug: null, narrow: false, settleMs: SETTLE_MS, build: true }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--narrow') {
      opts.narrow = true
    } else if (arg === '--no-build') {
      opts.build = false
    } else if (arg === '--settle') {
      const raw = argv[++i]
      if (!/^\d+$/.test(raw ?? '')) throw new InspectError('--settle needs a non-negative integer number of milliseconds')
      opts.settleMs = Number(raw)
    } else if (arg.startsWith('--')) {
      throw new InspectError(`unknown option ${arg}`)
    } else if (opts.slug === null) {
      opts.slug = arg
    } else {
      throw new InspectError(`unexpected argument ${arg}`)
    }
  }
  if (!opts.slug) throw new InspectError('missing presentation slug')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(opts.slug)) throw new InspectError(`invalid slug ${JSON.stringify(opts.slug)}`)
  return opts
}

export function viewportFor(narrow) {
  return { ...(narrow ? NARROW_VIEWPORT : DESKTOP_VIEWPORT) }
}

export function stepFileName(index) {
  return `step-${String(index + 1).padStart(2, '0')}.png`
}

export function artifactDir(root, slug, narrow) {
  return join(root, '.inspection', slug, narrow ? 'narrow' : '')
}

export function rectsOverlap(p, q) {
  const w = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)
  const h = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y)
  return w > OVERLAP_EPSILON_PX && h > OVERLAP_EPSILON_PX
}

/**
 * Pairs of text/chrome records whose rendered text boxes intersect. A record is
 * `{ id, label, text, rects, allowed, ancestors }` where `allowed` marks an
 * element inside a data-presentation-allow-overlap subtree and `ancestors` lists
 * the ids of records that contain it (nested text is not a collision).
 */
export function findOverlaps(records) {
  const pairs = []
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i]
      const b = records[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors?.includes(b.id) || b.ancestors?.includes(a.id)) continue
      if (a.rects.some((p) => b.rects.some((q) => rectsOverlap(p, q)))) pairs.push([a, b])
    }
  }
  return pairs
}

const chromeKey = (item) => JSON.stringify([...ACTIVE_STYLE_KEYS.map((k) => item.style?.[k]), item.width, item.height])

/**
 * `groups` maps a chrome kind (progress, toc) to items `{ label, text, active,
 * style, width, height }`. An active item is indistinct when an inactive sibling
 * of the same kind has identical style, width and height.
 */
export function findIndistinctActive(groups) {
  const issues = []
  for (const [kind, items] of Object.entries(groups)) {
    const inactive = items.filter((item) => !item.active)
    for (const active of items.filter((item) => item.active)) {
      const twin = inactive.find((other) => chromeKey(other) === chromeKey(active))
      if (twin) issues.push({ kind, label: active, twin })
    }
  }
  return issues
}

function defaultSerif(fontFamily) {
  const first = (fontFamily ?? '').split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase()
  return first === '' || DEFAULT_SERIF_FAMILIES.has(first)
}

/**
 * Reasons the attribution is unpolished, or `[]` when it passes. `attr` is
 * `{ fontSizePx, color, fontFamily, rect }` or null when the element is absent.
 */
export function attributionIssues(attr, viewport) {
  if (!attr) return ['no attribution element rendered']
  const issues = []
  if (!(attr.fontSizePx >= ATTRIBUTION_MIN_PX)) issues.push(`font-size ${attr.fontSizePx}px is below ${ATTRIBUTION_MIN_PX}px`)
  if (attr.color === DEFAULT_LINK_COLOR) issues.push('browser-default link color')
  if (defaultSerif(attr.fontFamily)) issues.push('browser-default serif font-family')
  const r = attr.rect
  const overlapX = Math.min(r.x + r.w, viewport.width) - Math.max(r.x, viewport.width / 2)
  const overlapY = Math.min(r.y + r.h, viewport.height) - Math.max(r.y, viewport.height / 2)
  const inBottomRight = r.w > 0 && r.h > 0 && overlapX > 0 && overlapY > 0
  if (!inBottomRight) issues.push('not at least partly in the bottom-right quadrant')
  return issues
}

const describeRecord = (r) => (r.text ? `${r.label} "${r.text}"` : r.label)

/** Visibility of one collected element: not display:none, not visibility:hidden, and no display:none or opacity:0 ancestor. */
export function isVisibleElement(el) {
  return !el.hiddenChain && el.display !== 'none' && el.visibility !== 'hidden'
}

/**
 * How an element contributes to overlap detection. Elements with a visible box (paint, icon or
 * control, graphic) are compared by their element box; other text-bearing elements by their text
 * glyph ranges, so full-width captions do not collide with what sits beside their text.
 */
export function collectionKind(el) {
  if (el.isControl || el.isGraphic || el.hasPaint) return el.box.w > 0 && el.box.h > 0 ? 'element' : null
  return el.textRects.length > 0 ? 'text' : null
}

/** Overlap records from raw per-element facts gathered in the page (see collectSnapshot). */
export function buildTextRecords(elements) {
  const recordOf = new Map()
  const records = []
  elements.forEach((el, i) => {
    if (!isVisibleElement(el)) return
    const kind = collectionKind(el)
    if (!kind) return
    recordOf.set(i, records.length)
    records.push({
      id: records.length,
      label: el.label,
      text: el.text,
      rects: kind === 'element' ? [el.box] : el.textRects,
      allowed: el.allowed,
      ancestors: [],
    })
  })
  for (const [rawIndex, id] of recordOf) {
    for (let p = elements[rawIndex].parent; p >= 0; p = elements[p].parent) {
      if (recordOf.has(p)) records[id].ancestors.push(recordOf.get(p))
    }
  }
  return records
}

/** Turns one settled step snapshot (see collectSnapshot) into WARN lines. */
export function analyzeStep(snapshot, step) {
  const warnings = []
  const warn = (kind, message) => warnings.push(`WARN step ${step} [${kind}] ${message}`)
  for (const [a, b] of findOverlaps(buildTextRecords(snapshot.elements ?? []))) {
    warn('overlap', `${describeRecord(a)} collides with ${describeRecord(b)}; mark an intentional overlap with data-presentation-allow-overlap`)
  }
  const chrome = snapshot.chrome ?? {}
  for (const issue of findIndistinctActive(chrome)) {
    warn(
      'active-chrome',
      `active ${issue.kind} ${describeRecord(issue.label)} is visually indistinguishable from inactive ${describeRecord(issue.twin)}`,
    )
  }
  const attrIssues = attributionIssues(snapshot.attribution, snapshot.viewport)
  if (attrIssues.length > 0) {
    warn('attribution', `data-presentation-attribution: ${attrIssues.join('; ')}; style the [data-presentation-attribution] link`)
  }
  return warnings
}

const delay = (ms) => new Promise((done) => setTimeout(done, ms))

async function pollUntil(read, isDone, attempts, sleep) {
  let last = null
  for (let i = 0; i < attempts; i++) {
    last = await read()
    if (isDone(last)) return last
    await sleep(POLL_MS)
  }
  return null
}

/**
 * Runs in the page. Returns plain data only: text boxes, chrome styles and the
 * attribution geometry. Self-contained because Playwright serializes it.
 */
export function collectSnapshot() {
  const root = document.querySelector('[data-presentation-root]')
  if (!root) return { hasRoot: false }
  const rect = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })
  const snip = (t) => (t.length > 40 ? `${t.slice(0, 37)}...` : t)
  const describe = (el) => {
    const hook = Array.from(el.attributes, (a) => a.name).find((n) => n.startsWith('data-presentation-'))
    return el.tagName.toLowerCase() + (hook ? `[${hook}]` : '')
  }
  const ownText = (el) =>
    Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  const textRects = (el) => {
    const out = []
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) out.push(rect(r))
    }
    return out
  }
  const styleOf = (el) => {
    const cs = getComputedStyle(el)
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      border: ['Top', 'Right', 'Bottom', 'Left']
        .map((s) => `${cs[`border${s}Width`]} ${cs[`border${s}Style`]} ${cs[`border${s}Color`]}`)
        .join('|'),
      boxShadow: cs.boxShadow,
      opacity: cs.opacity,
      fontWeight: cs.fontWeight,
      textDecorationLine: cs.textDecorationLine,
      transform: cs.transform,
    }
  }
  const elements = Array.from(root.querySelectorAll('*'))
  const indexOf = new Map(elements.map((el, i) => [el, i]))
  const hasPaint = (cs) =>
    (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
    (Number.parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') ||
    cs.boxShadow !== 'none'
  const rawElements = elements.map((el) => {
    const cs = getComputedStyle(el)
    let hiddenChain = false
    for (let n = el; n; n = n.parentElement) {
      const c = n === el ? cs : getComputedStyle(n)
      if (c.display === 'none' || Number.parseFloat(c.opacity) === 0) {
        hiddenChain = true
        break
      }
    }
    const tag = el.tagName.toLowerCase()
    const role = el.getAttribute('role') ?? ''
    return {
      label: describe(el),
      text: snip(ownText(el)),
      parent: indexOf.get(el.parentElement) ?? -1,
      display: cs.display,
      visibility: cs.visibility,
      hiddenChain,
      hasPaint: hasPaint(cs),
      isControl:
        ['button', 'a', 'input', 'select', 'textarea'].includes(tag) ||
        ['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'slider'].includes(role),
      isGraphic: ['svg', 'img', 'canvas'].includes(tag),
      textRects: textRects(el),
      box: rect(el.getBoundingClientRect()),
      allowed: el.closest('[data-presentation-allow-overlap]') !== null,
    }
  })
  const chromeItems = (selector) =>
    Array.from(root.querySelectorAll(selector)).map((el) => {
      const r = el.getBoundingClientRect()
      return {
        label: describe(el),
        text: snip(ownText(el)),
        active: el.getAttribute('data-presentation-active') === 'true',
        style: styleOf(el),
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
      }
    })
  const attrEl = root.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (attrEl) {
    const cs = getComputedStyle(attrEl)
    attribution = {
      fontSizePx: Number.parseFloat(cs.fontSize),
      color: cs.color,
      fontFamily: cs.fontFamily,
      rect: rect(attrEl.getBoundingClientRect()),
    }
  }
  return {
    hasRoot: true,
    stepIndex: Number.parseInt(root.getAttribute('data-step-index') ?? '', 10),
    stepCount: Number.parseInt(root.getAttribute('data-step-count') ?? '', 10),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    elements: rawElements,
    chrome: {
      progress: chromeItems('[data-presentation-progress-item]'),
      toc: chromeItems('[data-presentation-toc-item]'),
    },
    attribution,
  }
}

/**
 * Opens the presentation, steps through every step, waits the settle interval
 * before each capture, and writes the screenshots. Throws InspectError on any
 * fatal condition. Warnings are logged and never throw.
 */
export async function captureSteps({ page, url, settleMs, outDir, sleep = delay, log = console.log }) {
  await page.goto(url, { waitUntil: 'load' })
  const ready = await pollUntil(() => page.evaluate(collectSnapshot), (s) => s.hasRoot, READY_ATTEMPTS, sleep)
  if (!ready) throw new InspectError(`route not found: ${url} rendered no [data-presentation-root]`)
  const count = ready.stepCount
  if (!Number.isInteger(count) || count < 1) {
    throw new InspectError('no data-step-count hook on [data-presentation-root]')
  }
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })
  const files = []
  let warningCount = 0
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      const advanced = await pollUntil(
        () => page.evaluate(collectSnapshot),
        (s) => s.stepIndex === i,
        ADVANCE_ATTEMPTS,
        sleep,
      )
      if (!advanced) throw new InspectError(`step ${i + 1} did not become active after ArrowRight`)
    }
    await sleep(settleMs)
    const settled = await page.evaluate(collectSnapshot)
    if (settled.stepIndex !== i) throw new InspectError(`step ${i + 1} is not active after settling`)
    for (const line of analyzeStep(settled, i + 1)) {
      log(line)
      warningCount++
    }
    const file = join(outDir, stepFileName(i))
    try {
      await page.screenshot({ path: file, type: 'png' })
    } catch (e) {
      throw new InspectError(`capture failed for step ${i + 1}: ${e instanceof Error ? e.message : String(e)}`)
    }
    files.push(file)
  }
  return { files, warnings: warningCount }
}

function freePort() {
  return new Promise((res, rej) => {
    const server = createServer()
    server.once('error', rej)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => res(port))
    })
  })
}

function buildProject(root) {
  return new Promise((res, rej) => {
    const child = spawn('npm', ['run', 'build'], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('error', (e) => rej(new InspectError(`build could not start: ${e.message}`)))
    child.on('close', (code) => {
      if (code === 0) res()
      else rej(new InspectError(`build failed (exit ${code}); fix the build or pass --no-build`))
    })
  })
}

async function startPreviewServer(root) {
  const port = await freePort()
  const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  let output = ''
  let exited = false
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  child.on('exit', () => (exited = true))
  const close = () =>
    new Promise((res) => {
      if (exited) return res()
      child.once('exit', () => res())
      child.kill('SIGTERM')
    })
  for (let i = 0; i < PREVIEW_ATTEMPTS && !exited; i++) {
    try {
      await fetch(`http://${HOST}:${port}/`)
      return { port, close }
    } catch {
      await delay(100)
    }
  }
  await close()
  throw new InspectError(`vite preview did not serve on ${HOST}:${port}: ${output.trim()}`)
}

const defaultLaunch = () => chromium.launch({ headless: true })

/** Runs the whole helper. Resolves to the process exit code (0 or 1; 2 for usage). */
export async function main(argv = process.argv.slice(2), deps = {}) {
  const {
    root = PROJECT_ROOT,
    log = console.log,
    error = console.error,
    runBuild = buildProject,
    startPreview = startPreviewServer,
    launchBrowser = defaultLaunch,
    sleep = delay,
  } = deps
  let opts
  try {
    opts = parseArgs(argv)
  } catch (e) {
    error(`inspect: ${e.message}`)
    error(USAGE)
    return 2
  }
  const outDir = artifactDir(root, opts.slug, opts.narrow)
  let preview = null
  let browser = null
  try {
    if (opts.build) await runBuild(root)
    preview = await startPreview(root)
    const url = `http://${HOST}:${preview.port}/${opts.slug}`
    browser = await launchBrowser()
    const context = await browser.newContext({ viewport: viewportFor(opts.narrow) })
    const page = await context.newPage()
    const { files, warnings } = await captureSteps({
      page,
      url,
      settleMs: opts.settleMs,
      outDir,
      sleep,
      log,
    })
    log(`output: ${outDir}`)
    log(`summary: ${opts.slug} captured ${files.length} step(s), ${warnings} advisory warning(s), exit 0`)
    return 0
  } catch (e) {
    error(`inspect: fatal: ${e instanceof Error ? e.message : String(e)}`)
    return 1
  } finally {
    if (browser) await browser.close().catch(() => {})
    if (preview) await preview.close().catch(() => {})
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main()
}
