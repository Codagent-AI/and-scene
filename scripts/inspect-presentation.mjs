#!/usr/bin/env node
// Captures settled per-step screenshots from a production preview and prints advisory warnings.
// Usage: node scripts/inspect-presentation.mjs <slug> [--out dir] [--settle ms] [--viewport WxH] [--skip-build]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { attributionIssues, findOverlaps, isActiveDistinct } from './inspection-checks.mjs'
import { run, SETTLE_MS, startPreview } from './preview.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STEP_TIMEOUT_MS = 4000

function parseArgs(argv) {
  const opts = { slug: undefined, out: undefined, settle: SETTLE_MS, viewport: '1440x900', build: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') opts.out = argv[++i]
    else if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--viewport') opts.viewport = argv[++i]
    else if (a === '--skip-build') opts.build = false
    else if (!a.startsWith('--') && !opts.slug) opts.slug = a
    else throw new Error(`unknown argument: ${a}`)
  }
  if (!opts.slug) throw new Error('usage: inspect-presentation <slug> [--out dir] [--settle ms] [--viewport WxH] [--skip-build]')
  const m = /^(\d+)x(\d+)$/.exec(opts.viewport)
  if (!m || !(opts.settle >= 0)) throw new Error('invalid --viewport or --settle')
  opts.size = { width: Number(m[1]), height: Number(m[2]) }
  opts.out = path.resolve(root, opts.out ?? path.join('inspection', opts.slug))
  return opts
}

// Runs in the page: plain data only, so the checks stay in inspection-checks.mjs.
function collectPage() {
  const rectOf = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })
  const visible = (el) => {
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05
  }
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-allow-overlap')
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return `${el.tagName.toLowerCase()}${hook ? `[${hook.name}]` : ''} "${text}"`
  }
  const items = []
  const els = []
  // Visible text, plus text-less controls and icons (progress dots, icon buttons, glyphs) that text must not cover.
  const CONTROL = 'button, a[href], [data-presentation-glyph], [data-presentation-progress-dot]'
  for (const el of document.querySelectorAll('[data-presentation-root] *')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
    if (!visible(el) || (!own.length && !el.matches(CONTROL))) continue
    let rect
    let rects
    if (own.length) {
      const range = document.createRange()
      range.selectNodeContents(el)
      rect = rectOf(range.getBoundingClientRect())
      // Wrapped text has one box per line; the union rect also covers the gaps between lines.
      rects = [...range.getClientRects()].map(rectOf).filter((r) => r.w > 0 && r.h > 0)
    } else rect = rectOf(el.getBoundingClientRect())
    if (rect.w === 0 || rect.h === 0) continue
    els.push(el)
    items.push({ label: describe(el), rect, rects, allowed: el.closest('[data-presentation-allow-overlap]') !== null, ancestors: [] })
  }
  items.forEach((item, i) => {
    els.forEach((other, j) => {
      if (i !== j && other.contains(els[i])) item.ancestors.push(j)
    })
  })

  const style = (el) => {
    const cs = getComputedStyle(el)
    const props = Object.fromEntries(
      ['backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'fontWeight', 'opacity', 'transform', 'boxShadow', 'outlineStyle', 'textDecorationLine'].map((p) => [p, cs[p]]),
    )
    return { ...props, size: el.textContent.trim() ? '' : `${cs.width} ${cs.height}` }
  }
  const chrome = []
  for (const [name, selector] of [
    ['progress indicator', '[data-presentation-progress-dot]'],
    ['table-of-contents entry', '[data-presentation-toc-entry]'],
  ]) {
    const all = [...document.querySelectorAll(selector)]
    const active = all.find((e) => e.getAttribute('aria-current') === 'step')
    const inactive = all.find((e) => e !== active)
    if (active && inactive) chrome.push({ name, active: style(active), inactive: style(inactive) })
  }
  const attr = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (attr) {
    const cs = getComputedStyle(attr)
    attribution = { fontSize: parseFloat(cs.fontSize), color: cs.color, fontFamily: cs.fontFamily, rect: rectOf(attr.getBoundingClientRect()) }
  }
  return { items, chrome, attribution }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.build) {
    const { code, output } = await run('npm', ['run', 'build'], root)
    if (code !== 0) throw new Error(`build failed\n${output.slice(-2000)}`)
  }
  fs.rmSync(opts.out, { recursive: true, force: true })
  fs.mkdirSync(opts.out, { recursive: true })
  const preview = await startPreview(root)
  const browser = await chromium.launch()
  const warnings = []
  const manifest = []
  try {
    const page = await (await browser.newContext({ viewport: opts.size })).newPage()
    await page.goto(`${preview.url}/${opts.slug}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-presentation-root]', { timeout: STEP_TIMEOUT_MS })
    const root$ = page.locator('[data-presentation-root]')
    const count = Number(await root$.getAttribute('data-step-count'))
    for (let i = 0; i < count; i++) {
      const navigatedAt = Date.now()
      await page.waitForTimeout(opts.settle)
      const file = path.join(opts.out, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      manifest.push({ step: i + 1, file: path.relative(root, file), navigatedAt, capturedAt: Date.now(), settleMs: opts.settle })
      const data = await page.evaluate(collectPage)
      const step = i + 1
      for (const [a, b] of findOverlaps(data.items)) warnings.push(`step ${step}: overlap between ${a} and ${b} (mark intentional overlap with data-presentation-allow-overlap)`)
      for (const c of data.chrome) {
        if (!isActiveDistinct(c.active, c.inactive)) warnings.push(`step ${step}: active ${c.name} is indistinct from inactive ones (style [aria-current="step"] / [data-active="true"])`)
      }
      for (const issue of attributionIssues(data.attribution)) warnings.push(`step ${step}: attribution ${issue} (style [data-presentation-attribution])`)
      if (i < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n), i + 1, { timeout: STEP_TIMEOUT_MS })
      }
    }
  } finally {
    await browser.close().catch(() => {})
    preview.stop()
  }
  fs.writeFileSync(path.join(opts.out, 'manifest.json'), JSON.stringify({ slug: opts.slug, viewport: opts.size, steps: manifest, warnings }, null, 2))
  console.log(`[inspect] ${manifest.length} screenshots written to ${path.relative(root, opts.out)}/`)
  for (const w of warnings) console.log(`[inspect] WARN ${w}`)
  console.log(`[inspect] ${warnings.length} advisory warning(s)`)
}

main().catch((err) => {
  console.error(`[inspect] ERROR ${err.message}`)
  process.exit(1)
})
