#!/usr/bin/env node
// `npm run inspect -- <slug>`: capture one settled screenshot per step from a production preview
// and print advisory warnings about collisions, indistinct active chrome and unpolished attribution.
// Warnings never change the exit code; only operational failures (no build, bad slug, no browser) do.
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PhaseError, runBuild, startPreview } from './lib/preview.mjs'

/** Longer than a full transition: layout morph (0.6s) + newcomer delay (0.65s) + fade (0.4s) + margin. */
export const DEFAULT_SETTLE_MS = 2400
export const DEFAULT_VIEWPORT = { width: 1440, height: 900 }
export const ALLOW_OVERLAP_ATTR = 'data-presentation-allow-overlap'
const MIN_OVERLAP_PX = 2
export const MIN_ATTRIBUTION_PX = 11
const DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(0, 0, 255)'])
const STYLE_KEYS = [
  'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'opacity', 'fontWeight',
  'textDecorationLine', 'boxShadow', 'width', 'height', 'transform', 'outlineWidth',
]

// ---------------------------------------------------------------------------------------------
// Pure analysis (unit-tested). Inputs come from `collectSnapshot`, which runs inside the page.
// ---------------------------------------------------------------------------------------------

const intersects = (a, b) =>
  Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) >= MIN_OVERLAP_PX &&
  Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) >= MIN_OVERLAP_PX

/** A chrome box naturally surrounds its own content; two text runs that overlap never do. */
const containsAsBox = (outer, inner) => outer.kind === 'chrome' && inner.ancestors.includes(outer.id)

/**
 * @param {{ id: number, kind: 'text' | 'chrome', desc: string, rect: {x:number,y:number,w:number,h:number}, allow: boolean, ancestors: number[] }[]} items
 * Visible text and chrome boxes. `ancestors` lists the ids of items that contain this one in the DOM.
 */
export function findOverlaps(items) {
  const found = []
  const visible = items.filter((i) => i.rect.w > 0 && i.rect.h > 0)
  for (let a = 0; a < visible.length; a++) {
    for (let b = a + 1; b < visible.length; b++) {
      const p = visible[a]
      const q = visible[b]
      // Exempt only when both sides are marked: a marked element can still collide with unmarked chrome.
      if (p.allow && q.allow) continue
      if (containsAsBox(p, q) || containsAsBox(q, p)) continue
      if (intersects(p.rect, q.rect)) found.push(`${p.desc} overlaps ${q.desc}`)
    }
  }
  return found
}

/** True when the active control looks exactly like its inactive siblings. */
export function isIndistinct(active, inactive) {
  return STYLE_KEYS.every((k) => paints(active, k) === paints(inactive, k))
}

// A style value only counts if it paints something: border colour needs a border width.
function paints(style, key) {
  if (key === 'borderTopColor' && !(parseFloat(style.borderTopWidth) > 0)) return ''
  return style[key]
}

/** @returns {string | null} a warning message, or null when the attribution is fine */
export function attributionWarning(info) {
  const hook = 'style it through the [data-presentation-attribution] hook in your presentation CSS'
  if (!info) return `attribution link not found; ${hook}`
  if (info.fontSizePx < MIN_ATTRIBUTION_PX || info.height < MIN_ATTRIBUTION_PX) {
    return `attribution is too small (${info.fontSizePx}px text); ${hook}`
  }
  if (DEFAULT_LINK_COLORS.has(info.color)) return `attribution uses the browser-default link color; ${hook}`
  return null
}

/** Turn one step's snapshot into advisory warnings. */
export function analyseSnapshot(snapshot) {
  const warnings = []
  for (const message of findOverlaps(snapshot.items)) warnings.push({ type: 'overlap', message })
  for (const group of snapshot.groups) {
    if (!group.active || group.inactive.length === 0) continue
    if (isIndistinct(group.active, group.inactive[0])) {
      warnings.push({ type: 'active-chrome', message: `active ${group.name} item is indistinguishable from inactive ones; style [data-presentation-active]` })
    }
  }
  const attribution = attributionWarning(snapshot.attribution)
  if (attribution) warnings.push({ type: 'attribution', message: attribution })
  return warnings
}

// ---------------------------------------------------------------------------------------------
// In-page collection. Must stay self-contained: it is serialised into the browser.
// ---------------------------------------------------------------------------------------------

/** @param {{ allowAttr: string, styleKeys: string[] }} cfg */
export function collectSnapshot(cfg) {
  const CHROME = [
    '[data-presentation-progress-item]', '[data-presentation-nav]', '[data-presentation-mode-toggle]',
    '[data-presentation-toc-item]', '[data-presentation-attribution]',
  ].join(',')
  const shown = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false
    }
    return true
  }
  const ownTextRect = (el) => {
    let box = null
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      for (const r of range.getClientRects()) {
        if (r.width === 0 || r.height === 0) continue
        box = box
          ? { l: Math.min(box.l, r.left), t: Math.min(box.t, r.top), r: Math.max(box.r, r.right), b: Math.max(box.b, r.bottom) }
          : { l: r.left, t: r.top, r: r.right, b: r.bottom }
      }
    }
    if (!box) return null
    // Text clipped by its own element (overflow hidden / ellipsis) is not visible past the box.
    if (getComputedStyle(el).overflowX !== 'visible') {
      const own = el.getBoundingClientRect()
      box = { l: Math.max(box.l, own.left), t: box.t, r: Math.min(box.r, own.right), b: box.b }
      if (box.r <= box.l) return null
    }
    return { x: box.l, y: box.t, w: box.r - box.l, h: box.b - box.t }
  }
  const describe = (el) => {
    const hooks = [...el.attributes]
      .filter((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active')
      .map((a) => (a.value ? `${a.name}=${a.value}` : a.name))
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return `<${el.tagName.toLowerCase()}${hooks.length ? ' ' + hooks.join(' ') : ''}>${text ? ` "${text}"` : ''}`
  }
  const items = []
  const elements = []
  for (const el of document.body.querySelectorAll('*')) {
    if (!shown(el)) continue
    const box = el.getBoundingClientRect()
    const chrome = el.matches(CHROME)
    const rect = chrome ? { x: box.left, y: box.top, w: box.width, h: box.height } : ownTextRect(el)
    if (!rect) continue
    items.push({ id: items.length, kind: chrome ? 'chrome' : 'text', desc: describe(el), rect, allow: el.closest(`[${cfg.allowAttr}]`) !== null, ancestors: [] })
    elements.push(el)
  }
  items.forEach((item, i) => {
    elements.forEach((other, j) => {
      if (i !== j && other.contains(elements[i])) item.ancestors.push(j)
    })
  })
  const style = (el) => {
    const cs = getComputedStyle(el)
    // Text controls differ in width simply because their labels differ; only compare the size of
    // empty indicators such as progress dots.
    const keys = el.textContent.trim() ? cfg.styleKeys.filter((k) => k !== 'width' && k !== 'height') : cfg.styleKeys
    return Object.fromEntries(keys.map((k) => [k, cs[k]]))
  }
  const groups = [
    ['progress', '[data-presentation-progress-item]'],
    ['table-of-contents', '[data-presentation-toc-item]'],
  ].map(([name, sel]) => {
    const all = [...document.querySelectorAll(sel)]
    const active = all.find((el) => el.hasAttribute('data-presentation-active') || el.getAttribute('aria-current') === 'step')
    return { name, active: active ? style(active) : null, inactive: all.filter((el) => el !== active).map(style) }
  })
  const link = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (link) {
    const cs = getComputedStyle(link)
    attribution = { fontSizePx: parseFloat(cs.fontSize), height: link.getBoundingClientRect().height, color: cs.color }
  }
  return { items, groups, attribution }
}

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------

export function parseArgs(argv, env = {}) {
  const opts = {
    slug: undefined,
    settleMs: env.INSPECT_SETTLE_MS ? Number(env.INSPECT_SETTLE_MS) : DEFAULT_SETTLE_MS,
    viewport: DEFAULT_VIEWPORT,
    out: 'artifacts/inspection',
    label: undefined,
    build: 'auto',
    mode: undefined,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = () => {
      if (i + 1 >= argv.length) throw new PhaseError('usage', `${arg} needs a value`)
      return argv[++i]
    }
    if (arg === '--settle') opts.settleMs = Number(value())
    else if (arg === '--viewport') {
      const m = /^(\d+)x(\d+)$/.exec(value())
      if (!m) throw new PhaseError('usage', '--viewport must look like 390x844')
      opts.viewport = { width: Number(m[1]), height: Number(m[2]) }
      opts.label = `${m[1]}x${m[2]}`
    } else if (arg === '--out') opts.out = value()
    else if (arg === '--label') opts.label = value()
    else if (arg === '--mode') opts.mode = value()
    else if (arg === '--no-build') opts.build = 'never'
    else if (arg === '--build') opts.build = 'always'
    else if (arg.startsWith('-')) throw new PhaseError('usage', `unknown option ${arg}`)
    else if (!opts.slug) opts.slug = arg
    else throw new PhaseError('usage', `unexpected argument ${arg}`)
  }
  if (!opts.slug) throw new PhaseError('usage', 'usage: npm run inspect -- <slug> [--viewport 390x844] [--settle ms] [--out dir] [--no-build]')
  if (!Number.isFinite(opts.settleMs) || opts.settleMs < 0) throw new PhaseError('usage', 'settle must be a non-negative number of milliseconds')
  return opts
}

export const stepFile = (n) => `step-${String(n + 1).padStart(2, '0')}.png`

export async function main(root, argv, env = process.env) {
  let preview
  let browser
  try {
    const opts = parseArgs(argv, env)
    const dist = path.join(root, 'dist', 'index.html')
    if (opts.build === 'always' || (opts.build === 'auto' && !existsSync(dist))) {
      console.log('building (npm run build)')
      await runBuild(root)
    } else if (!existsSync(dist)) {
      throw new PhaseError('inspect', 'no production build found; run npm run build or drop --no-build')
    }
    const dir = path.resolve(root, opts.out, opts.label ? `${opts.slug}-${opts.label}` : opts.slug)
    await mkdir(dir, { recursive: true })

    preview = await startPreview(root)
    const { chromium } = await import('playwright')
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: opts.viewport })
    const url = `${preview.origin}/${opts.slug}`
    const response = await page.goto(url, { waitUntil: 'load' })
    if (!response?.ok()) throw new PhaseError('inspect', `could not open ${url}`)
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 8000 })
    } catch {
      throw new PhaseError('inspect', `"${opts.slug}" rendered no presentation (is the slug registered?)`)
    }
    if (opts.mode === 'present') await page.keyboard.press('p')
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))

    const steps = []
    const warnings = []
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n), i, { timeout: 5000 })
      }
      const navigatedAt = Date.now()
      await page.waitForTimeout(opts.settleMs)
      const capturedAt = Date.now()
      const file = stepFile(i)
      await page.screenshot({ path: path.join(dir, file) })
      const snapshot = await page.evaluate(collectSnapshot, { allowAttr: ALLOW_OVERLAP_ATTR, styleKeys: STYLE_KEYS })
      for (const w of analyseSnapshot(snapshot)) {
        warnings.push({ step: i + 1, ...w })
        console.log(`WARN step ${String(i + 1).padStart(2, '0')} [${w.type}] ${w.message}`)
      }
      steps.push({ step: i + 1, file, navigatedAt, capturedAt })
    }
    const manifest = { slug: opts.slug, url, viewport: opts.viewport, settleMs: opts.settleMs, steps, warnings }
    await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    console.log(`captured ${count} screenshots in ${path.relative(root, dir)}`)
    console.log(warnings.length ? `${warnings.length} advisory warning(s); review the steps above` : 'no advisory warnings')
    return 0
  } catch (e) {
    console.error(`inspect failed${e instanceof PhaseError ? ` [${e.phase}]` : ''}: ${e instanceof PhaseError ? e.message : (e?.stack ?? e)}`)
    return 1
  } finally {
    await browser?.close().catch(() => {})
    await preview?.stop()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  process.on('SIGINT', () => process.exit(130))
  process.on('SIGTERM', () => process.exit(130))
  process.exitCode = await main(root, process.argv.slice(2))
}
