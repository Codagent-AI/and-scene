// Captures settled per-step screenshots from a production preview and prints
// advisory visual diagnostics. Usage:
//   npm run inspect -- <slug> [--no-build] [--settle ms] [--viewport WxH] [--out dir]
// Screenshots and warnings are inspection artifacts, not pass/fail evidence;
// `npm run verify` stays the deterministic gate.
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PhaseError, runNpm, startPreview } from './lib/preview.mjs'

/** Must outlast the kit's layout morph, entry delay, and fade (see constants.ts). */
export const DEFAULT_SETTLE_MS = 1200
export const DESKTOP_VIEWPORT = { width: 1280, height: 720 }
const OVERLAP_TOLERANCE_PX = 1
/** Attribution text under this computed size reads as unpolished. */
export const MIN_ATTRIBUTION_FONT_PX = 11

/** Active chrome is indistinct when all of these match an inactive sibling. */
export const ACTIVE_STYLE_PROPS = [
  'color', 'backgroundColor', 'opacity', 'fontWeight',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
]

const pad = (n) => String(n + 1).padStart(2, '0')

/** Runs in the page: gathers visible text/chrome rectangles and chrome styles. */
export function collectDiagnostics(styleProps) {
  const CHROME = [
    'title', 'caption', 'marker', 'progress-item', 'toc-item', 'prev', 'next', 'mode-toggle', 'attribution',
  ].map((name) => `[data-presentation-${name}]`).join(',')
  const root = document.querySelector('[data-presentation-root]')
  const visible = (el) => {
    const cs = getComputedStyle(el)
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0
  }
  const textRect = (el) => {
    let box
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const r = range.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) continue
      box = box
        ? { l: Math.min(box.l, r.left), t: Math.min(box.t, r.top), r: Math.max(box.r, r.right), b: Math.max(box.b, r.bottom) }
        : { l: r.left, t: r.top, r: r.right, b: r.bottom }
    }
    return box && { x: box.l, y: box.t, w: box.r - box.l, h: box.b - box.t }
  }
  const describe = (el) => {
    const hook = el.getAttribute('data-presentation-id') ??
      el.getAttributeNames().find((n) => n.startsWith('data-presentation-'))?.replace('data-presentation-', '') ?? el.tagName.toLowerCase()
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return text ? `${hook} "${text}"` : hook
  }
  const elements = []
  for (const el of root ? root.querySelectorAll('*') : []) {
    if (!visible(el)) continue
    const own = textRect(el)
    const chrome = el.matches(CHROME)
    let rect = own
    if (!rect && chrome) {
      const r = el.getBoundingClientRect()
      rect = { x: r.left, y: r.top, w: r.width, h: r.height }
    }
    if (!rect || rect.w <= 0 || rect.h <= 0) continue
    elements.push({ el, rect })
  }
  const items = elements.map(({ el, rect }, id) => ({
    id,
    label: describe(el),
    rect,
    exempt: el.closest('[data-presentation-allow-overlap]') !== null,
    ancestors: elements.flatMap((o, j) => (o.el !== el && o.el.contains(el) ? [j] : [])),
  }))
  const styles = (el) => {
    const cs = getComputedStyle(el)
    return Object.fromEntries(styleProps.map((p) => [p, cs[p]]))
  }
  const activePair = (name) => {
    const active = document.querySelector(`[data-presentation-${name}][data-presentation-active="true"]`)
    const inactive = document.querySelector(`[data-presentation-${name}]:not([data-presentation-active])`)
    return active && inactive ? { active: styles(active), inactive: styles(inactive) } : null
  }
  const link = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (link) {
    const cs = getComputedStyle(link)
    const r = link.getBoundingClientRect()
    attribution = { fontSize: parseFloat(cs.fontSize), height: r.height, color: cs.color, fontFamily: cs.fontFamily }
  }
  return {
    mode: root?.getAttribute('data-mode') ?? null,
    items,
    active: { progress: activePair('progress-item'), toc: activePair('toc-item') },
    attribution,
  }
}

/**
 * Pairs of visible text/chrome rectangles that intersect. A pair is exempt only
 * when both elements sit inside allow-overlap subtrees; nesting never counts.
 */
export function findOverlaps(items, tolerance = OVERLAP_TOLERANCE_PX) {
  const pairs = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.exempt && b.exempt) continue
      if (a.ancestors?.includes(b.id) || b.ancestors?.includes(a.id)) continue
      const w = Math.min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) - Math.max(a.rect.x, b.rect.x)
      const h = Math.min(a.rect.y + a.rect.h, b.rect.y + b.rect.h) - Math.max(a.rect.y, b.rect.y)
      if (w > tolerance && h > tolerance) pairs.push([a, b])
    }
  }
  return pairs
}

/** Names the style properties by which an active control differs from an inactive one. */
export const compareActive = (active, inactive) => Object.keys(active).filter((prop) => active[prop] !== inactive[prop])


const BROWSER_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)'])

/** Advisory problems with the attribution link; empty when it looks intentional. */
export function assessAttribution(info) {
  if (!info) return ['attribution link [data-presentation-attribution] is missing from the presentation']
  const problems = []
  if (info.fontSize < MIN_ATTRIBUTION_FONT_PX || info.height < 12) {
    problems.push(`attribution is too small (${info.fontSize}px text); size it via [data-presentation-attribution]`)
  }
  if (BROWSER_LINK_COLORS.has(info.color) || /^"?Times New Roman/i.test(info.fontFamily ?? '')) {
    problems.push('attribution uses browser-default link styling; style [data-presentation-attribution]')
  }
  return problems
}

/** Turns one step's diagnostics into advisory warning strings. */
export function analyze(diagnostics) {
  const warnings = []
  for (const [a, b] of findOverlaps(diagnostics.items)) {
    warnings.push(`overlap: ${a.label} overlaps ${b.label} (mark intentional overlaps with data-presentation-allow-overlap)`)
  }
  for (const [name, pair] of Object.entries(diagnostics.active)) {
    if (pair && compareActive(pair.active, pair.inactive).length === 0) {
      warnings.push(`active ${name === 'toc' ? 'table-of-contents entry' : 'progress indicator'} is visually indistinct from inactive ones; style [data-presentation-active="true"]`)
    }
  }
  for (const problem of assessAttribution(diagnostics.attribution)) warnings.push(problem)
  return warnings
}

/** Walks every step: advance, wait the settle interval, screenshot, diagnose. */
export async function captureSteps({ page, count, outDir, settleMs, log = console.log }) {
  const manifest = []
  const warnings = []
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(
        (want) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(want),
        i,
        { timeout: 5_000 },
      )
    }
    const started = Date.now()
    await page.waitForTimeout(settleMs)
    const waitedMs = Date.now() - started
    const file = path.join(outDir, `step-${pad(i)}.png`)
    await page.screenshot({ path: file })
    manifest.push({ step: i, file, settleMs, waitedMs })
    log(`[inspect] step ${i + 1}/${count} -> ${file}`)
    for (const message of analyze(await page.evaluate(collectDiagnostics, ACTIVE_STYLE_PROPS))) {
      warnings.push({ step: i, message })
      log(`WARN step ${i + 1} (index ${i}): ${message}`)
    }
  }
  await writeFile(path.join(outDir, 'captures.json'), JSON.stringify({ captures: manifest, warnings }, null, 2))
  return { manifest, warnings }
}

export function parseArgs(argv) {
  const opts = { slug: undefined, build: true, settleMs: DEFAULT_SETTLE_MS, viewport: DESKTOP_VIEWPORT, out: undefined }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--no-build') opts.build = false
    else if (arg === '--settle') opts.settleMs = Number(argv[++i])
    else if (arg === '--out') opts.out = argv[++i]
    else if (arg === '--viewport') {
      const [width, height] = String(argv[++i]).split('x').map(Number)
      opts.viewport = { width, height }
    } else if (!arg.startsWith('--') && !opts.slug) opts.slug = arg
    else throw new Error(`unknown argument: ${arg}`)
  }
  if (!opts.slug) throw new Error('usage: npm run inspect -- <slug> [--no-build] [--settle ms] [--viewport WxH] [--out dir]')
  if (!Number.isFinite(opts.settleMs) || opts.settleMs < 0) throw new Error('--settle needs a non-negative number of milliseconds')
  if (!(opts.viewport.width > 0 && opts.viewport.height > 0)) throw new Error('--viewport needs WxH, e.g. 390x844')
  return opts
}

export async function runInspect({ cwd = process.cwd(), argv, log = console.log }) {
  const opts = parseArgs(argv)
  const { chromium } = await import('playwright')
  if (opts.build) await runNpm(['run', 'build'], { cwd, phase: 'build' })
  await stat(path.join(cwd, 'dist/index.html')).catch(() => {
    throw new PhaseError('build', 'dist/index.html is missing; run without --no-build to build first')
  })
  const isDesktop = opts.viewport === DESKTOP_VIEWPORT
  const outDir = path.resolve(cwd, opts.out ?? path.join('inspection', isDesktop ? opts.slug : `${opts.slug}-${opts.viewport.width}x${opts.viewport.height}`))
  await mkdir(outDir, { recursive: true })
  const preview = await startPreview({ cwd, phase: 'preview', log })
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: opts.viewport })
    const consoleErrors = []
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
    page.on('pageerror', (e) => consoleErrors.push(e.message))
    const target = preview.url(`/${opts.slug}`)
    log(`[inspect] production preview ${target} (dist/, viewport ${opts.viewport.width}x${opts.viewport.height}, settle ${opts.settleMs}ms)`)
    await page.goto(target)
    await page.waitForSelector('[data-presentation-root]', { timeout: 10_000 }).catch(() => {
      throw new PhaseError('inspect', `no presentation rendered at ${target}`)
    })
    const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
    const { warnings } = await captureSteps({ page, count, outDir, settleMs: opts.settleMs, log })
    for (const message of consoleErrors) log(`WARN console error during capture: ${message}`)
    log(`[inspect] ${count} screenshots in ${outDir}; ${warnings.length + consoleErrors.length} advisory warning(s). Advisory only: \`npm run verify\` is the gate.`)
  } finally {
    await browser?.close().catch(() => {})
    await preview.stop()
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    await runInspect({ argv: process.argv.slice(2) })
  } catch (error) {
    console.error(`INSPECT FAILED: ${error.message}`)
    process.exitCode = 1
  }
}
