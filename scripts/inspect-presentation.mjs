#!/usr/bin/env node
// Screenshot capture + advisory visual diagnostics for one presentation.
//   npm run inspect -- <slug> [--settle <ms>] [--narrow] [--no-build] [--port <n>]
// Writes inspection/<slug>/step-NN.png (and step-NN-narrow.png) plus report.json.
// Warnings are advisory: the process exits 0 unless it cannot run at all.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { freePort, previewUrl, registeredSlugs, run, startPreview } from './verify.mjs'

export const DESKTOP_VIEWPORT = { width: 1280, height: 720 }
export const NARROW_VIEWPORT = { width: 390, height: 844 }
// Longer than the kit's newcomer entry (600 ms delay + 400 ms fade) plus a margin.
export const DEFAULT_SETTLE_MS = 1600
export const MIN_ATTRIBUTION_PX = 11
const DEFAULT_LINK_COLORS = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(238, 238, 238)']

export function artifactDir(root, slug) {
  return path.join(root, 'inspection', slug)
}

export function screenshotPath(root, slug, index, variant = '') {
  const n = String(index + 1).padStart(2, '0')
  return path.join(artifactDir(root, slug), `step-${n}${variant ? `-${variant}` : ''}.png`)
}

const area = (r) => r.w * r.h

function intersection(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return { w, h }
}

/**
 * items: { id, label, rect:{x,y,w,h}, allowed } for visible text ranges and
 * chrome controls. Pairs touching an allow-overlap subtree are exempt; every
 * other overlapping pair is reported, whatever the element nesting.
 */
export function findOverlaps(items) {
  const out = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed) continue
      const { w, h } = intersection(a.rect, b.rect)
      if (w <= 1 || h <= 1) continue
      if (w * h < 0.1 * Math.min(area(a.rect), area(b.rect))) continue
      out.push([a.label, b.label])
    }
  }
  return out
}

// Paint-related properties compared between active and inactive controls.
// Size is added for progress items only: ToC entry widths follow their text.
const PAINT_KEYS = [
  'backgroundColor',
  'color',
  'borderColor',
  'borderWidth',
  'opacity',
  'boxShadow',
  'outlineStyle',
  'outlineColor',
  'fontWeight',
  'textDecorationLine',
  'transform',
]
const SIZE_KEYS = ['width', 'height']

/** True when the active control's computed style matches any inactive one. */
export function isIndistinctActive(active, inactive) {
  if (!active || inactive.length === 0) return false
  const same = (a, b) => Object.keys(active).every((k) => a[k] === b[k])
  return inactive.some((s) => same(active, s))
}

/** Returns a reason string when the attribution looks unpolished, else null. */
export function classifyAttribution(info) {
  if (!info) return 'attribution link is missing'
  if (info.fontSize < MIN_ATTRIBUTION_PX) return `attribution is undersized (${info.fontSize}px)`
  if (DEFAULT_LINK_COLORS.includes(info.color) || /times/i.test(info.fontFamily)) {
    return 'attribution uses browser-default link styling'
  }
  return null
}

export function describeWarnings(stepIndex, analysis) {
  const step = `step ${stepIndex + 1} (index ${stepIndex})`
  const warnings = []
  for (const [a, b] of findOverlaps(analysis.items)) {
    warnings.push(
      `[overlap] ${step}: ${a} overlaps ${b}. Fix the collision, or mark an intentional readable overlap with data-presentation-allow-overlap`,
    )
  }
  if (isIndistinctActive(analysis.progress.active, analysis.progress.inactive)) {
    warnings.push(
      `[active-progress] ${step}: the active progress indicator looks the same as inactive ones. Style [data-presentation-progress-item][data-presentation-active]`,
    )
  }
  if (isIndistinctActive(analysis.toc.active, analysis.toc.inactive)) {
    warnings.push(
      `[active-toc] ${step}: the active table-of-contents entry looks the same as inactive ones. Style [data-presentation-toc-item][data-presentation-active]`,
    )
  }
  const attribution = classifyAttribution(analysis.attribution)
  if (attribution) {
    warnings.push(`[attribution] ${step}: ${attribution}. Style [data-presentation-attribution]`)
  }
  return warnings
}

/** Runs inside the page: gathers visible text/chrome geometry and chrome styles. */
export function collectAnalysis([paintKeys, sizeKeys]) {
  const CHROME = '[data-presentation-header],[data-presentation-footer],[data-presentation-toc],[data-presentation-attribution]'
  const root = document.querySelector('[data-presentation-root]')
  const effectiveOpacity = (el) => {
    let o = 1
    for (let n = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity)
    return o
  }
  const visible = (el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && effectiveOpacity(el) > 0.05
  }
  const label = (el, text) => {
    const hook = el.closest('[data-presentation-entity]')?.getAttribute('data-presentation-entity')
    const name = [...el.attributes].map((a) => a.name).find((n) => n.startsWith('data-presentation-') && n !== 'data-presentation-entity')
    return `${text ? `"${text.slice(0, 40)}"` : `<${el.tagName.toLowerCase()}${name ? ` ${name}` : ''}>`}${hook ? ` [entity ${hook}]` : ''}`
  }
  const elements = new Map()
  const add = (el, rect, text) => {
    if (!elements.has(el)) elements.set(el, { el, rect, text })
  }
  const CONTROLS = '[data-presentation-progress-item],[data-presentation-prev],[data-presentation-next],[data-presentation-toc-item],[data-presentation-attribution]'
  // Controls count with their full box (padding included); their text is not collected separately.
  for (const el of root.querySelectorAll(CONTROLS)) {
    if (!visible(el)) continue
    const r = el.getBoundingClientRect()
    add(el, { x: r.x, y: r.y, w: r.width, h: r.height }, el.textContent.trim())
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent.trim()
    const el = n.parentElement
    if (!text || !visible(el) || el.closest(CONTROLS)) continue
    const range = document.createRange()
    range.selectNodeContents(n)
    const r = range.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const prev = elements.get(el)
    if (prev) {
      const x = Math.min(prev.rect.x, r.x)
      const y = Math.min(prev.rect.y, r.y)
      prev.rect = { x, y, w: Math.max(prev.rect.x + prev.rect.w, r.right) - x, h: Math.max(prev.rect.y + prev.rect.h, r.bottom) - y }
      prev.text += ` ${text}`
    } else add(el, { x: r.x, y: r.y, w: r.width, h: r.height }, text)
  }
  const list = [...elements.values()].map((e, id) => ({ ...e, id }))
  const items = list.map((e) => ({
    id: e.id,
    label: `${e.el.closest(CHROME) ? 'chrome ' : 'text '}${label(e.el, e.text)}`,
    rect: e.rect,
    allowed: e.el.closest('[data-presentation-allow-overlap]') !== null,
  }))
  const sig = (el, keys) => {
    const cs = getComputedStyle(el)
    return Object.fromEntries(keys.map((k) => [k, cs[k]]))
  }
  const group = (sel, keys) => {
    const all = [...root.querySelectorAll(sel)].filter(visible)
    const active = all.find((e) => e.hasAttribute('data-presentation-active'))
    return {
      active: active ? sig(active, keys) : null,
      inactive: all.filter((e) => e !== active).map((e) => sig(e, keys)),
    }
  }
  const attr = root.querySelector('[data-presentation-attribution]')
  const acs = attr && getComputedStyle(attr)
  return {
    items,
    progress: group('[data-presentation-progress-item]', [...paintKeys, ...sizeKeys]),
    toc: group('[data-presentation-toc-item]', paintKeys),
    attribution: attr
      ? { fontSize: parseFloat(acs.fontSize), color: acs.color, fontFamily: acs.fontFamily, textDecorationLine: acs.textDecorationLine }
      : null,
  }
}

/**
 * Walks every step: advance, wait for the step index, wait out the settle
 * interval, then capture. `waitedMs` records the settle time before each shot.
 */
export async function captureSteps({ page, count, settleMs, shotPath, analyze }) {
  const steps = []
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(
        (n) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(n),
        i,
        { timeout: 5000 },
      )
    }
    const settledAt = Date.now()
    await page.waitForTimeout(settleMs)
    const waitedMs = Date.now() - settledAt
    const file = shotPath(i)
    await page.screenshot({ path: file })
    steps.push({ index: i, file, waitedMs, warnings: describeWarnings(i, await analyze(page)) })
  }
  return steps
}

function parseArgs(argv) {
  const opts = { slug: null, settle: DEFAULT_SETTLE_MS, narrow: false, build: true, port: undefined }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--port') opts.port = Number(argv[++i])
    else if (a === '--narrow') opts.narrow = true
    else if (a === '--no-build') opts.build = false
    else if (!a.startsWith('--')) opts.slug = a
  }
  return opts
}

export async function inspect({ root = process.cwd(), slug, settle = DEFAULT_SETTLE_MS, narrow = false, build = true, port }) {
  const slugs = registeredSlugs(readFileSync(path.join(root, 'src', 'presentations', 'index.ts'), 'utf8'))
  if (!slugs.includes(slug)) {
    throw new Error(`"${slug}" is not registered in src/presentations/index.ts (registered: ${slugs.join(', ') || 'none'})`)
  }
  if (build) {
    const b = await run('npm', ['run', 'build'], root)
    if (b.code !== 0) throw new Error(`npm run build failed:\n${b.out.trim()}`)
  }
  const { chromium } = await import('playwright')
  const previewPort = port ?? (await freePort())
  const preview = await startPreview(root, previewPort)
  let browser
  try {
    browser = await chromium.launch()
    mkdirSync(artifactDir(root, slug), { recursive: true })
    const report = { slug, settleMs: settle, passes: [] }
    const passes = [{ name: 'desktop', viewport: DESKTOP_VIEWPORT, variant: '' }]
    if (narrow) passes.push({ name: 'narrow', viewport: NARROW_VIEWPORT, variant: 'narrow' })
    for (const p of passes) {
      const page = await browser.newPage({ viewport: p.viewport })
      try {
        await page.goto(previewUrl(previewPort, `/${slug}`), { waitUntil: 'load' })
        await page.waitForSelector('[data-step-count]', { timeout: 10000 })
        const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
        const steps = await captureSteps({
          page,
          count,
          settleMs: settle,
          shotPath: (i) => screenshotPath(root, slug, i, p.variant),
          analyze: (pg) => pg.evaluate(collectAnalysis, [PAINT_KEYS, SIZE_KEYS]),
        })
        report.passes.push({ name: p.name, viewport: p.viewport, steps })
      } finally {
        await page.close()
      }
    }
    writeFileSync(path.join(artifactDir(root, slug), 'report.json'), JSON.stringify(report, null, 2))
    return report
  } finally {
    await browser?.close().catch(() => {})
    await preview.stop()
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (!opts.slug) {
    console.error('usage: npm run inspect -- <slug> [--settle <ms>] [--narrow] [--no-build] [--port <n>]')
    process.exit(2)
  }
  try {
    const report = await inspect(opts)
    let total = 0
    for (const pass of report.passes) {
      for (const s of pass.steps) {
        console.log(`captured ${pass.name} step ${s.index + 1}: ${path.relative(process.cwd(), s.file)}`)
        for (const w of s.warnings) {
          total++
          console.warn(`warning ${w}`)
        }
      }
    }
    console.log(`inspect: ${total} advisory warning(s); screenshots in ${path.relative(process.cwd(), artifactDir(process.cwd(), opts.slug))}`)
  } catch (e) {
    console.error(`inspect: ${e instanceof Error ? e.message : e}`)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
}
