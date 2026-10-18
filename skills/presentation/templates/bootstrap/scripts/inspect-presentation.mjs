import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { startPreview } from './lib/preview.mjs'

// Advisory screenshot helper: writes per-step PNGs and prints warnings, never fails on them.

export const VIEWPORTS = { desktop: { width: 1440, height: 900 }, narrow: { width: 390, height: 844 } }
export const DEFAULT_SETTLE_MS = 1200
export const MIN_ATTRIBUTION_PX = 12
export const OUT_DIR = '.presentation-inspection'
const ANIMATION_TIMEOUT_MS = 8000
const STEP_TIMEOUT_MS = 3000
const STYLE_KEYS = ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'fontWeight', 'opacity', 'width', 'height']

export function parseArgs(argv, env = {}) {
  const args = { slug: undefined, viewport: 'desktop', settleMs: Number(env.INSPECT_SETTLE_MS) || DEFAULT_SETTLE_MS, build: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--narrow') args.viewport = 'narrow'
    else if (a === '--no-build') args.build = false
    else if (a === '--settle') args.settleMs = Number(argv[++i])
    else if (a.startsWith('--settle=')) args.settleMs = Number(a.slice(9))
    else if (!a.startsWith('--') && args.slug === undefined) args.slug = a
    else throw new Error(`unknown argument: ${a}`)
  }
  if (!args.slug) throw new Error('usage: inspect-presentation <slug> [--narrow] [--settle <ms>] [--no-build]')
  if (!(args.settleMs >= 0)) throw new Error('--settle needs a non-negative number of milliseconds')
  return args
}

export function stepFileName(step) {
  return `step-${String(step).padStart(2, '0')}.png`
}

export function outputDir(root, slug, viewport) {
  const base = path.join(root, OUT_DIR, slug)
  return viewport === 'narrow' ? path.join(base, 'narrow') : base
}

function intersects(a, b) {
  return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
}

/**
 * Items are visible text/chrome elements: { label, rect, allowed, nested }.
 * `allowed` marks items inside a data-presentation-allow-overlap subtree; `nested`
 * lists indices of other items this one contains (ancestor/descendant is not a collision).
 */
export function detectOverlaps(items) {
  const found = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed || a.nested?.includes(j) || b.nested?.includes(i)) continue
      if (intersects(a.rect, b.rect)) found.push([a.label, b.label])
    }
  }
  return found
}

/** Active chrome is indistinct when it looks exactly like an inactive sibling. */
export function isDistinct(active, inactives) {
  return !inactives.some((other) => STYLE_KEYS.every((k) => active[k] === other[k]))
}

export function attributionIssue(attr) {
  if (!attr) return 'no attribution link found'
  if (attr.fontSize < MIN_ATTRIBUTION_PX) return `font-size ${attr.fontSize}px is under ${MIN_ATTRIBUTION_PX}px`
  if (attr.color === 'rgb(0, 0, 238)' && attr.underline) return 'still has the browser-default link color and underline'
  return null
}

/** Turns what the page reported for one step into advisory warning lines. */
export function analyzeStep(step, data) {
  const warnings = []
  for (const [a, b] of detectOverlaps(data.items)) {
    warnings.push(`WARN [overlap] step ${step}: ${a} overlaps ${b}`)
  }
  for (const group of data.chrome) {
    if (group.inactives.length && !isDistinct(group.active, group.inactives)) {
      warnings.push(`WARN [active-chrome] step ${step}: active ${group.name} looks the same as inactive ones; style [data-presentation-active="true"]`)
    }
  }
  const issue = attributionIssue(data.attribution)
  if (issue) {
    warnings.push(`WARN [attribution] step ${step}: ${issue}; style [data-presentation-attribution]`)
  }
  return warnings
}

/** Runs in the page: reports visible text/chrome boxes, active-chrome styles and attribution. */
function collect() {
  const visible = (el, rect) => {
    const cs = getComputedStyle(el)
    return rect.width > 0 && rect.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0
  }
  const rectOf = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active')
    const entity = el.getAttribute('data-presentation-entity')
    const name = entity ? `[data-presentation-entity="${entity}"]` : hook ? `[${hook.name}]` : el.tagName.toLowerCase()
    return `${name} "${(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)}"`
  }
  const els = []
  const elements = []
  for (const el of document.body.querySelectorAll('*')) {
    const ownText = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
    const control = el.matches('button, a[href]')
    if (!ownText.length && !control) continue
    let box
    if (ownText.length && !control) {
      const range = document.createRange()
      range.setStartBefore(ownText[0])
      range.setEndAfter(ownText[ownText.length - 1])
      box = range.getBoundingClientRect()
    } else {
      box = el.getBoundingClientRect()
    }
    if (!visible(el, box)) continue
    elements.push(el)
    els.push({ label: describe(el), rect: rectOf(box), allowed: !!el.closest('[data-presentation-allow-overlap]') })
  }
  els.forEach((item, i) => {
    item.nested = elements.reduce((acc, other, j) => (i !== j && elements[i].contains(other) ? [...acc, j] : acc), [])
  })

  const styleOf = (el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      color: cs.color, backgroundColor: cs.backgroundColor, borderColor: cs.borderTopColor,
      borderWidth: cs.borderTopWidth, fontWeight: cs.fontWeight, opacity: cs.opacity,
      width: Math.round(r.width), height: Math.round(r.height),
    }
  }
  const chrome = []
  for (const [name, sel] of [['progress item', '[data-presentation-progress-item]'], ['table-of-contents entry', '[data-presentation-toc-entry]']]) {
    const all = [...document.querySelectorAll(sel)]
    const active = all.find((e) => e.getAttribute('data-presentation-active') === 'true' || e.hasAttribute('aria-current'))
    if (active) chrome.push({ name, active: styleOf(active), inactives: all.filter((e) => e !== active).map(styleOf) })
  }
  const attrEl = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (attrEl) {
    const cs = getComputedStyle(attrEl)
    attribution = { fontSize: parseFloat(cs.fontSize), color: cs.color, underline: cs.textDecorationLine.includes('underline') }
  }
  return { items: els, chrome, attribution }
}

async function waitForSettle(page, settleMs) {
  const started = Date.now()
  await page.waitForTimeout(settleMs)
  await page
    .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), null, { timeout: ANIMATION_TIMEOUT_MS })
    .catch(() => {})
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
  return { waitedMs: Date.now() - started, running }
}

export async function inspect(root, args, log = console.log) {
  if (args.build) {
    const built = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8' })
    if (built.status !== 0) throw new Error(`npm run build failed\n${built.stdout}${built.stderr}`)
  }
  const { chromium } = await import('playwright')
  const preview = await startPreview(root)
  const dir = outputDir(root, args.slug, args.viewport)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: VIEWPORTS[args.viewport] })
    await page.goto(`${preview.url}/${args.slug}`)
    await page.waitForSelector('[data-step-count]', { timeout: 15000 })
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    const report = { slug: args.slug, viewport: args.viewport, settleMs: args.settleMs, steps: [], warnings: [] }
    for (let index = 0; index < count; index++) {
      const step = index + 1
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((i) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(i), index, { timeout: STEP_TIMEOUT_MS })
      }
      const settle = await waitForSettle(page, args.settleMs)
      const file = path.join(dir, stepFileName(step))
      const png = await page.screenshot({ path: file })
      const title = await page.evaluate(() => document.querySelector('[data-presentation-title]')?.textContent?.trim() ?? '')
      const warnings = analyzeStep(step, await page.evaluate(collect))
      warnings.forEach((w) => log(w))
      report.warnings.push(...warnings)
      report.steps.push({
        step, index, title, file: path.relative(root, file),
        sha256: crypto.createHash('sha256').update(png).digest('hex'),
        settledAfterMs: settle.waitedMs, runningAnimations: settle.running,
      })
      log(`captured step ${step}/${count}: ${path.relative(root, file)}`)
    }
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2))
    log(`inspection: ${count} screenshots in ${path.relative(root, dir)}, ${report.warnings.length} advisory warning(s)`)
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

async function main() {
  const root = path.resolve(fileURLToPath(import.meta.url), '..', '..')
  try {
    await inspect(root, parseArgs(process.argv.slice(2), process.env))
  } catch (error) {
    console.error(`inspect failed: ${error?.message ?? error}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
