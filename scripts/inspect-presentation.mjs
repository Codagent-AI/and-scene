#!/usr/bin/env node
// Screenshot helper: captures one settled screenshot per step from a production
// preview and prints advisory visual warnings. Warnings never change the exit code.
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { HOST, launchChromium, runNpm, startPreview } from './lib/preview.mjs'

export const DEFAULTS = { viewport: { width: 1440, height: 900 }, settleMs: 1200, outDir: '.presentation-inspect' }
export const MIN_ATTRIBUTION_PX = 12
const DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(0, 0, 255)'])
const COMPARED_STYLES = ['color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'fontWeight', 'opacity', 'textDecorationLine', 'outlineStyle', 'outlineWidth', 'outlineColor', 'boxShadow', 'width', 'height']

export function parseArgs(argv) {
  const opts = { slug: undefined, viewport: { ...DEFAULTS.viewport }, settleMs: DEFAULTS.settleMs, outDir: DEFAULTS.outDir, build: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--viewport') {
      const m = /^(\d+)x(\d+)$/.exec(argv[++i] ?? '')
      if (!m) throw new Error('--viewport expects WIDTHxHEIGHT, e.g. 390x844')
      opts.viewport = { width: Number(m[1]), height: Number(m[2]) }
    } else if (a === '--settle') opts.settleMs = Number(argv[++i])
    else if (a === '--out') opts.outDir = argv[++i]
    else if (a === '--skip-build') opts.build = false
    else if (!a.startsWith('--') && !opts.slug) opts.slug = a
    else throw new Error(`unknown argument ${a}`)
  }
  if (!opts.slug) throw new Error('usage: npm run inspect -- <slug> [--viewport WxH] [--settle ms] [--out dir] [--skip-build]')
  if (!Number.isFinite(opts.settleMs) || opts.settleMs < 0) throw new Error('--settle expects milliseconds')
  return opts
}

export const shotPath = (outDir, slug, index) => join(outDir, slug, `step-${String(index + 1).padStart(2, '0')}.png`)

const AREA_EPSILON = 0.5
/** True when two rects share more than a sliver of area (touching edges do not count). */
export function rectsOverlap(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > AREA_EPSILON && h > AREA_EPSILON
}

/** Overlapping visible text/chrome pairs; a pair inside an allow-overlap subtree is exempt. */
export function findOverlaps(items) {
  const out = []
  const shown = items.filter((i) => i.visible !== false && i.rect.width > 0 && i.rect.height > 0)
  for (let i = 0; i < shown.length; i++) {
    for (let j = i + 1; j < shown.length; j++) {
      const a = shown[i]
      const b = shown[j]
      if (a.allowOverlap || b.allowOverlap) continue
      if (rectsOverlap(a.rect, b.rect)) out.push([a.name, b.name])
    }
  }
  return out
}

/** True when the active item looks exactly like an inactive sibling. */
export function isIndistinct(active, inactive) {
  return COMPARED_STYLES.every((k) => active[k] === inactive[k])
}

export function attributionIssue(info) {
  if (!info) return 'attribution link is missing'
  if (info.fontSize < MIN_ATTRIBUTION_PX) return `attribution text is ${info.fontSize}px (under ${MIN_ATTRIBUTION_PX}px)`
  if (DEFAULT_LINK_COLORS.has(info.color) && info.textDecorationLine.includes('underline')) return 'attribution uses the browser-default link color and underline'
  return null
}

/** Turn what the page reported for one step into advisory warning lines. */
export function warningsFor(step, data) {
  const w = []
  for (const [a, b] of findOverlaps(data.items)) w.push(`step ${step}: overlap between ${a} and ${b} (mark intentional overlaps with data-presentation-allow-overlap)`)
  for (const [label, pair] of [['progress indicator', data.progress], ['table-of-contents entry', data.toc]]) {
    if (pair && isIndistinct(pair.active, pair.inactive)) w.push(`step ${step}: active ${label} is visually indistinct from inactive ones (style [data-presentation-active="true"])`)
  }
  const issue = attributionIssue(data.attribution)
  if (issue) w.push(`step ${step}: ${issue}; style it via [data-presentation-attribution]`)
  return w
}

/* Runs in the page: gathers rects/styles; all judging happens in Node. */
function collect(styleKeys) {
  const describe = (el) => {
    const id = el.getAttribute('data-presentation-entity') || el.getAttribute('data-role')
    const attr = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active')
    const label = (el.textContent || '').trim().slice(0, 30)
    return `${el.tagName.toLowerCase()}${id ? `[${id}]` : attr ? `[${attr.name}]` : ''}${label ? ` "${label}"` : ''}`
  }
  const rectOf = (r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })
  const styleOf = (el, withSize) => {
    const cs = getComputedStyle(el)
    const out = {}
    for (const k of styleKeys) out[k] = cs[k]
    const r = el.getBoundingClientRect()
    // Size distinguishes content-free indicators; entries with different labels differ in width anyway.
    out.width = withSize ? `${Math.round(r.width)}px` : ''
    out.height = withSize ? `${Math.round(r.height)}px` : ''
    return out
  }
  const items = []
  const visible = (el) => {
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0
  }
  const push = (el, rect) => items.push({ name: describe(el), rect: rectOf(rect), visible: visible(el), allowOverlap: !!el.closest('[data-presentation-allow-overlap]') })
  for (const el of document.querySelectorAll('[data-presentation-canvas] *')) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!own) continue
    const range = document.createRange()
    range.selectNodeContents(el)
    push(el, range.getBoundingClientRect())
  }
  const chrome = '[data-presentation-marker],[data-presentation-title],[data-presentation-caption],[data-presentation-progress-item],[data-presentation-toc-entry],[data-presentation-prev],[data-presentation-next],[data-presentation-mode-toggle],[data-presentation-attribution]'
  for (const el of document.querySelectorAll(chrome)) push(el, el.getBoundingClientRect())
  const pair = (sel, withSize) => {
    const all = [...document.querySelectorAll(sel)]
    const active = all.find((e) => e.getAttribute('data-presentation-active') === 'true')
    const inactive = all.find((e) => e !== active)
    return active && inactive ? { active: styleOf(active, withSize), inactive: styleOf(inactive, withSize) } : null
  }
  const attr = document.querySelector('[data-presentation-attribution]')
  const attribution = attr ? (() => { const cs = getComputedStyle(attr); return { fontSize: parseFloat(cs.fontSize), color: cs.color, textDecorationLine: cs.textDecorationLine } })() : null
  return { items, progress: pair('[data-presentation-progress-item]', true), toc: pair('[data-presentation-toc-entry]', false), attribution }
}

async function waitStable(page, timeoutMs) {
  const sig = () => page.evaluate(() => [...document.querySelectorAll('[data-presentation-entity]')].map((e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)},${getComputedStyle(e).opacity}` }).join('|'))
  let prev = await sig()
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await page.waitForTimeout(100)
    const cur = await sig()
    if (cur === prev) return
    prev = cur
  }
}

/** Capture every step. Returns { files, warnings, captures }. */
export async function inspectPresentation({ cwd = process.cwd(), slug, viewport, settleMs, outDir, build = true, log = console.log }) {
  if (build) {
    const r = await runNpm(cwd, ['run', 'build'])
    if (r.code !== 0) throw new Error(`npm run build failed:\n${r.output.trim().split('\n').slice(-20).join('\n')}`)
  }
  const preview = await startPreview(cwd)
  const browser = await launchChromium()
  const files = []
  const warnings = []
  const captures = []
  try {
    const page = await browser.newPage({ viewport })
    await page.goto(`http://${HOST}:${preview.port}/${slug}`, { waitUntil: 'load' })
    const root = page.locator('[data-step-count]')
    await root.waitFor({ state: 'attached', timeout: 10000 })
    const count = Number(await root.getAttribute('data-step-count'))
    for (let i = 0; i < count; i++) {
      const advancedAt = Date.now()
      await page.waitForTimeout(settleMs)
      await waitStable(page, 3000)
      const file = resolve(cwd, shotPath(outDir, slug, i))
      await mkdir(join(file, '..'), { recursive: true })
      await page.screenshot({ path: file })
      const capturedAt = Date.now()
      files.push(file)
      captures.push({ step: i + 1, file, advancedAt, capturedAt, waitedMs: capturedAt - advancedAt })
      log(`captured step ${i + 1}/${count}: ${file}`)
      const w = warningsFor(i + 1, await page.evaluate(collect, COMPARED_STYLES))
      for (const line of w) {
        warnings.push(line)
        log(`warning: ${line}`)
      }
      if (i < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n), i + 1, { timeout: 5000 })
      }
    }
  } finally {
    await browser.close()
    await preview.stop()
  }
  await writeFile(resolve(cwd, outDir, slug, 'captures.json'), JSON.stringify({ settleMs, viewport, captures, warnings }, null, 2))
  log(`inspect: ${files.length} screenshots, ${warnings.length} advisory warning(s)`)
  return { files, warnings, captures }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  try {
    await inspectPresentation({ ...parseArgs(process.argv.slice(2)) })
  } catch (e) {
    console.error(`inspect: ERROR ${e.message}`)
    process.exit(1)
  }
}
