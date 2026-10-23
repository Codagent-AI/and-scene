// Per-step screenshots + advisory visual diagnostics: `npm run inspect -- <slug> [options]`.
// Options: --viewport WxH (default 1440x900)  --settle ms (default 1200)  --out dir (default .inspection)
//          --skip-build (reuse an existing dist/)
// Warnings are advisory: the process exits 0 unless the capture itself fails.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { HOST, freePort, run, startPreview } from './preview.mjs'

const OVERLAP_TOLERANCE = 2
const DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)'])
const MIN_ATTRIBUTION_FONT = 12
const MIN_ATTRIBUTION_HEIGHT = 18

// ---- pure diagnostics (unit-tested) ----------------------------------------

const intersects = (a, b) =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > OVERLAP_TOLERANCE &&
  Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > OVERLAP_TOLERANCE

/**
 * items: [{ id, label, rect, allowed, ancestors: [id] }] - visible text, controls and chrome regions.
 * Reports every pair of boxes that overlap (text/text, text/chrome, chrome/chrome), unless either
 * sits in an allow-overlap subtree or one contains the other in the DOM.
 */
export function findOverlaps(items) {
  const found = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue
      if (intersects(a.rect, b.rect)) found.push([a.label, b.label])
    }
  }
  return found
}

const parseRgb = (value) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
const colorDistance = (a, b) => {
  const [x, y] = [parseRgb(a), parseRgb(b)]
  return Math.max(...x.map((v, i) => Math.abs(v - (y[i] ?? 0))))
}

/** styles: { backgroundColor, color, borderColor, opacity, fontWeight, transform, textDecorationLine }. */
export function isDistinct(active, inactive) {
  for (const key of ['backgroundColor', 'color', 'borderColor']) {
    if (colorDistance(active[key], inactive[key]) >= 24) return true
  }
  if (active.backgroundColor !== inactive.backgroundColor && /rgba\(.*, 0\)$/.test(inactive.backgroundColor) !== /rgba\(.*, 0\)$/.test(active.backgroundColor)) return true
  // Size is deliberately not a signal: unstyled entries differ in width just from their labels.
  return ['opacity', 'fontWeight', 'transform', 'textDecorationLine'].some((k) => active[k] !== inactive[k])
}

/** groups: [{ name, active, inactive }] with style snapshots (inactive may be null). */
export function findIndistinctChrome(groups) {
  return groups.filter((g) => g.active && g.inactive && !isDistinct(g.active, g.inactive)).map((g) => g.name)
}

/** info: null when absent, else { color, fontSize, height }. Returns problem strings. */
export function attributionProblems(info) {
  if (!info) return ['attribution link is missing']
  const problems = []
  if (DEFAULT_LINK_COLORS.has(info.color)) problems.push('attribution uses the browser-default link color')
  if (info.fontSize < MIN_ATTRIBUTION_FONT || info.height < MIN_ATTRIBUTION_HEIGHT) problems.push('attribution is undersized')
  return problems
}

// ---- browser collection ------------------------------------------------------

function collectInPage() {
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05
  }
  const label = (el) => {
    const hook = el.getAttribute('data-presentation-entity') ?? [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))?.name
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 32)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const root = document.querySelector('[data-presentation-root]')
  const chromeSel = '[data-presentation-header], [data-presentation-footer], [data-presentation-toc]'
  const chrome = [...root.querySelectorAll(chromeSel)]
  const texts = [...root.querySelectorAll('*')].filter(
    (el) => !el.closest('svg') && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visible(el),
  )
  const controls = [...root.querySelectorAll('button, a[href]')].filter(visible)
  const els = [...new Set([...chrome, ...texts, ...controls])]
  const items = els.map((el, id) => ({ el, id }))
  const rectOf = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  }
  const out = items.map(({ el, id }) => ({
    id,
    label: label(el),
    rect: rectOf(el),
    allowed: el.closest('[data-presentation-allow-overlap]') !== null,
    ancestors: items.filter((o) => o.el !== el && o.el.contains(el)).map((o) => o.id),
  }))
  const snap = (el) => {
    const s = getComputedStyle(el)
    return {
      backgroundColor: s.backgroundColor,
      color: s.color,
      borderColor: s.borderTopColor,
      opacity: s.opacity,
      fontWeight: s.fontWeight,
      transform: s.transform,
      textDecorationLine: s.textDecorationLine,
    }
  }
  const group = (name, sel) => {
    const all = [...root.querySelectorAll(sel)]
    const active = all.find((e) => e.getAttribute('data-presentation-active') === 'true')
    const inactive = all.find((e) => e.getAttribute('data-presentation-active') === 'false')
    return { name, active: active ? snap(active) : null, inactive: inactive ? snap(inactive) : null }
  }
  const link = root.querySelector('[data-presentation-attribution]')
  const attribution = link
    ? { color: getComputedStyle(link).color, fontSize: parseFloat(getComputedStyle(link).fontSize), height: link.getBoundingClientRect().height }
    : null
  return {
    items: out,
    groups: [group('progress indicator', '[data-presentation-dot]'), group('table-of-contents entry', '[data-presentation-toc-entry]')],
    attribution,
  }
}

// ---- driver ------------------------------------------------------------------

export async function inspect(root, slug, { viewport = '1440x900', settle = 1200, out = '.inspection', skipBuild = false } = {}) {
  const [width, height] = viewport.split('x').map(Number)
  if (!width || !height) throw new Error(`invalid --viewport "${viewport}"`)
  if (!skipBuild) {
    const build = await run('npm', ['run', 'build'], root)
    if (build.code !== 0) throw new Error(`npm run build failed:\n${build.out.slice(-1500)}`)
  }
  const dir = path.resolve(root, out, slug, viewport)
  mkdirSync(dir, { recursive: true })
  const port = await freePort()
  const { stop } = await startPreview(root, port)
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const report = { slug, viewport, settleMs: settle, captures: [], warnings: [] }
  const seen = new Set()
  const warn = (step, kind, message) => {
    const key = `${kind}:${message}`
    if (kind !== 'overlap' && seen.has(key)) return
    seen.add(key)
    report.warnings.push({ step, kind, message })
    console.log(`WARN step ${step} ${kind}: ${message}`)
  }
  try {
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto(`http://${HOST}:${port}/${slug}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-presentation-root]', { timeout: 15000 })
    if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== 'browse') await page.keyboard.press('p')
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    let pressedAt = Date.now()
    for (let step = 0; step < count; step++) {
      await page.waitForTimeout(settle)
      const file = path.join(dir, `step-${String(step + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      report.captures.push({ step: step + 1, file, settledMs: Date.now() - pressedAt })
      const data = await page.evaluate(collectInPage)
      for (const [a, b] of findOverlaps(data.items)) warn(step + 1, 'overlap', `${a} overlaps ${b}`)
      for (const name of findIndistinctChrome(data.groups)) warn(step + 1, 'active-chrome', `active ${name} is visually indistinct from inactive ones`)
      for (const problem of attributionProblems(data.attribution)) warn(step + 1, 'attribution', `${problem}; style [data-presentation-attribution]`)
      pressedAt = Date.now()
      await page.keyboard.press('ArrowRight')
    }
  } finally {
    await browser.close()
    await stop()
  }
  writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`captured ${report.captures.length} screenshot(s) in ${path.relative(root, dir)}; ${report.warnings.length} advisory warning(s)`)
  return report
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const args = process.argv.slice(2)
  const opt = (name) => {
    const at = args.indexOf(`--${name}`)
    return at >= 0 ? args[at + 1] : undefined
  }
  const slug = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--skip-build'))
  if (!slug) {
    console.error('usage: inspect-presentation.mjs <slug> [--viewport WxH] [--settle ms] [--out dir] [--skip-build]')
    process.exitCode = 2
    return
  }
  try {
    await inspect(root, slug, {
      viewport: opt('viewport'),
      settle: opt('settle') ? Number(opt('settle')) : undefined,
      out: opt('out'),
      skipBuild: args.includes('--skip-build'),
    })
  } catch (e) {
    console.error(`inspect failed: ${e.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
