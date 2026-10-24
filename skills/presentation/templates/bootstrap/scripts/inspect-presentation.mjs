#!/usr/bin/env node
// Capture a settled screenshot of every step of a registered presentation from a
// production preview, and print advisory visual warnings. Warnings never fail the run.
//
//   node scripts/inspect-presentation.mjs <slug> [--viewport 1440x900] [--settle 1200]
//        [--out .presentation-inspect/<slug>] [--skip-build]
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { attributionIssues, findOverlaps, isActiveDistinct } from './inspect-lib.mjs'
import { readRegistrySlugs, runBuild, startPreview } from './lib.mjs'

const root = process.cwd()
const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : fallback
}
const slug = argv.find((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'))
if (!slug) {
  console.error('usage: inspect-presentation.mjs <slug> [--viewport WxH] [--settle ms] [--out dir] [--skip-build]')
  process.exit(2)
}
const [vw, vh] = flag('viewport', '1440x900').split('x').map(Number)
const settleMs = Number(flag('settle', 1200))
const outDir = path.resolve(root, flag('out', path.join('.presentation-inspect', slug)))

if (!readRegistrySlugs(root).includes(slug)) {
  console.error(`[inspect] "${slug}" is not registered in src/presentations/index.ts`)
  process.exit(2)
}

const STYLE_PROPS = [
  'backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'outlineStyle', 'width', 'height',
  'opacity', 'fontWeight', 'textDecorationLine', 'boxShadow', 'transform', 'fontSize', 'fontFamily',
]

/** Runs in the page: collects text/chrome boxes and chrome styles for analysis. */
function collect(styleProps) {
  const rootEl = document.querySelector('[data-presentation-root]')
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))?.name
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return `${el.tagName.toLowerCase()}${hook ? `[${hook}]` : ''}${text ? ` "${text}"` : ''}`
  }
  const visible = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false
    }
    return true
  }
  const textRect = (el) => {
    const range = document.createRange()
    const rects = []
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        range.selectNodeContents(node)
        rects.push(...range.getClientRects())
      }
    }
    if (!rects.length) return null
    const x = Math.min(...rects.map((r) => r.left))
    const y = Math.min(...rects.map((r) => r.top))
    return { x, y, w: Math.max(...rects.map((r) => r.right)) - x, h: Math.max(...rects.map((r) => r.bottom)) - y }
  }
  const chromeSel = '[data-presentation-progress-item],[data-presentation-toc-item],[data-presentation-nav-button],[data-presentation-mode-toggle]'
  const ids = new Map()
  const nameOf = (el) => {
    if (!ids.has(el)) ids.set(el, `${describe(el)}#${ids.size}`)
    return ids.get(el)
  }
  const items = []
  for (const el of rootEl.querySelectorAll('*')) {
    if (el.closest('svg') || !visible(el)) continue
    const isChrome = el.matches(chromeSel)
    const rect = isChrome ? el.getBoundingClientRect() : textRect(el)
    if (!rect) continue
    const r = { x: rect.x, y: rect.y, w: rect.w ?? rect.width, h: rect.h ?? rect.height }
    if (r.w <= 0 || r.h <= 0) continue
    const ancestors = []
    for (let n = el.parentElement; n; n = n.parentElement) ancestors.push(nameOf(n))
    items.push({ name: nameOf(el), rect: r, allowOverlap: el.closest('[data-presentation-allow-overlap]') !== null, ancestors })
  }
  const styleOf = (el) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(styleProps.map((p) => [p, s[p]]))
  }
  const activeVsInactive = (sel) => {
    const all = [...rootEl.querySelectorAll(sel)]
    const active = all.find((e) => e.getAttribute('aria-current') || e.dataset.active === 'true')
    const inactive = all.find((e) => e !== active)
    return active && inactive ? { name: describe(active), active: styleOf(active), inactive: styleOf(inactive) } : null
  }
  const attr = rootEl.querySelector('[data-presentation-attribution]')
  return {
    items,
    progress: activeVsInactive('[data-presentation-progress-item]'),
    toc: activeVsInactive('[data-presentation-toc-item]'),
    attribution: attr ? styleOf(attr) : null,
  }
}

async function main() {
  if (!argv.includes('--skip-build')) {
    const build = await runBuild(root)
    if (build.code !== 0) throw new Error(`npm run build failed:\n${build.out}`)
  }
  mkdirSync(outDir, { recursive: true })
  const preview = await startPreview(root)
  const browser = await chromium.launch()
  const warnings = []
  const captures = []
  const itemCounts = []
  try {
    const page = await browser.newPage({ viewport: { width: vw, height: vh } })
    await page.goto(`${preview.url}/${slug}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    for (let i = 0; i < count; i++) {
      const advancedAt = Date.now()
      await page.waitForTimeout(settleMs)
      const file = path.join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      captures.push({ step: i, file: path.relative(root, file), advancedAt, capturedAt: Date.now(), settleMs })

      const data = await page.evaluate(collect, STYLE_PROPS)
      itemCounts.push(data.items.length)
      for (const [a, b] of findOverlaps(data.items)) {
        warnings.push(`step ${i}: unmarked overlap between ${a} and ${b} (wrap intentional overlap in [data-presentation-allow-overlap])`)
      }
      for (const [label, pair] of [['progress indicator', data.progress], ['table-of-contents entry', data.toc]]) {
        if (pair && !isActiveDistinct(pair.active, pair.inactive)) {
          warnings.push(`step ${i}: active ${label} ${pair.name} is indistinct from inactive ones (style [data-active='true'] / [aria-current])`)
        }
      }
      if (data.attribution) {
        for (const issue of attributionIssues(data.attribution)) {
          warnings.push(`step ${i}: attribution ${issue} (style [data-presentation-attribution])`)
        }
      }
      if (i < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (n) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(n),
          i + 1,
          { timeout: 5000 },
        )
      }
    }
  } finally {
    await browser.close()
    await preview.stop()
  }
  writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ slug, viewport: { width: vw, height: vh }, captures, warnings, itemCounts }, null, 2))
  console.log(`[inspect] ${captures.length} screenshots written to ${path.relative(root, outDir)}`)
  for (const w of warnings) console.log(`[inspect] WARN ${w}`)
  console.log(`[inspect] ${warnings.length} advisory warning(s)`)
}

main().catch((err) => {
  console.error(`[inspect] failed: ${err.message}`)
  process.exitCode = 1
})
