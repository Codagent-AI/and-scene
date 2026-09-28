// Captures one settled screenshot per step from a production preview and prints
// advisory visual warnings. Usage:
//   npm run inspect -- <slug> [--viewport 1440x900] [--settle 1600] [--mode browse|present] [--skip-build]
// Screenshots land in .inspection/<slug>[-<WxH>]/step-NN.png. Warnings never fail the run.
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { ROOT, runBuild, sleep, startPreview } from './lib.mjs'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`)
  return at === -1 ? fallback : args[at + 1]
}
const slug = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
if (!slug) {
  console.error('usage: npm run inspect -- <slug> [--viewport WxH] [--settle ms] [--mode browse|present] [--skip-build]')
  process.exit(1)
}
const viewportArg = flag('viewport', '1440x900')
const [width, height] = viewportArg.split('x').map(Number)
const settle = Number(flag('settle', 1600))
const mode = flag('mode', undefined)
const custom = viewportArg !== '1440x900'
const outDir = join(ROOT, '.inspection', custom ? `${slug}-${viewportArg}` : slug)

/** Runs in the page: returns advisory warning strings for the current step. */
function collectWarnings() {
  const out = []
  const visible = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false
    }
    return true
  }
  const allowed = (el) => !!el.closest('[data-presentation-allow-overlap]')
  const label = (el) => {
    const text = (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))
    return `${el.tagName.toLowerCase()}${hook ? `[${hook.name}]` : ''}${text ? ` "${text}"` : ''}`
  }
  const textRect = (el) => {
    const rects = []
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const range = document.createRange()
        range.selectNodeContents(node)
        rects.push(...range.getClientRects())
      }
    }
    if (!rects.length) return null
    const left = Math.min(...rects.map((r) => r.left))
    const top = Math.min(...rects.map((r) => r.top))
    return { left, top, right: Math.max(...rects.map((r) => r.right)), bottom: Math.max(...rects.map((r) => r.bottom)) }
  }

  // 1. Overlap between visible text / chrome elements.
  const chromeSel =
    '[data-presentation-progress-item],[data-presentation-toc-item],[data-presentation-prev],[data-presentation-next],[data-presentation-attribution],[data-presentation-marker]'
  const items = []
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue
    const isChrome = el.matches(chromeSel)
    const rect = isChrome ? el.getBoundingClientRect() : textRect(el)
    if (rect && rect.right - rect.left > 0 && rect.bottom - rect.top > 0) items.push({ el, rect })
  }
  let overlaps = 0
  for (let i = 0; i < items.length && overlaps < 5; i++) {
    for (let j = i + 1; j < items.length && overlaps < 5; j++) {
      const a = items[i]
      const b = items[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      if (allowed(a.el) || allowed(b.el)) continue
      const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (w > 2 && h > 2) {
        overlaps++
        out.push(`overlap: ${label(a.el)} collides with ${label(b.el)} (mark intentional overlaps with data-presentation-allow-overlap)`)
      }
    }
  }

  // 2. Scene entities clipped by the stage.
  const stage = document.querySelector('[data-presentation-stage]')
  if (stage) {
    const s = stage.getBoundingClientRect()
    for (const el of document.querySelectorAll('[data-presentation-entity]')) {
      if (!visible(el) || allowed(el)) continue
      const r = el.getBoundingClientRect()
      if (r.width && (r.left < s.left - 2 || r.top < s.top - 2 || r.right > s.right + 2 || r.bottom > s.bottom + 2)) {
        out.push(`clipped: ${label(el)} extends beyond the stage`)
      }
    }
  }

  // 3. Active progress / table-of-contents state must be visibly distinct.
  const props = ['color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'opacity', 'fontWeight', 'textDecorationLine', 'boxShadow', 'outlineStyle', 'width', 'height', 'transform']
  for (const [name, sel] of [
    ['progress indicator', '[data-presentation-progress-item]'],
    ['table-of-contents entry', '[data-presentation-toc-item]'],
  ]) {
    const els = [...document.querySelectorAll(sel)].filter(visible)
    const active = els.find((e) => e.getAttribute('data-presentation-active') === 'true')
    const inactive = els.find((e) => e.getAttribute('data-presentation-active') === 'false')
    if (!active || !inactive) continue
    const a = getComputedStyle(active)
    const b = getComputedStyle(inactive)
    if (props.every((p) => a[p] === b[p])) {
      out.push(`chrome: active ${name} looks identical to inactive ones (style [data-presentation-active="true"])`)
    }
  }

  // 4. Attribution polish.
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    out.push('attribution: link is missing')
  } else {
    const s = getComputedStyle(attribution)
    const size = parseFloat(s.fontSize)
    const defaultBlue = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(0, 102, 204)'].includes(s.color)
    if (size < 11) out.push(`attribution: font-size ${size}px is too small (style .presentation-attribution / [data-presentation-attribution])`)
    if (defaultBlue) out.push('attribution: still uses the browser-default link color (style .presentation-attribution / [data-presentation-attribution])')
  }
  return out
}

async function main() {
  if (!args.includes('--skip-build') && !runBuild()) throw new Error('build failed')
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  const preview = await startPreview()
  const browser = await chromium.launch()
  const warnings = []
  try {
    const page = await browser.newPage({ viewport: { width, height } })
    page.on('console', (m) => m.type() === 'error' && warnings.push(`console error: ${m.text()}`))
    page.on('pageerror', (e) => warnings.push(`page error: ${e.message}`))
    await page.goto(`${preview.origin}/${slug}`)
    const root = page.locator('[data-presentation-root]')
    await root.waitFor({ timeout: 15_000 })
    if (mode && (await root.getAttribute('data-presentation-mode')) !== mode) await page.keyboard.press('p')
    const count = Number(await root.getAttribute('data-step-count'))
    for (let i = 0; i < count; i++) {
      await sleep(settle)
      const file = join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      console.log(`step ${i + 1}/${count}: ${file}`)
      for (const w of await page.evaluate(collectWarnings)) warnings.push(`step ${i + 1}: ${w}`)
      if (i < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (next) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(next),
          i + 1,
        )
      }
    }
  } finally {
    await browser.close()
    preview.stop()
  }
  const unique = [...new Set(warnings)]
  for (const w of unique) console.warn(`WARNING ${w}`)
  console.log(unique.length ? `inspect: ${unique.length} advisory warning(s)` : 'inspect: no advisory warnings')
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(`inspect failed: ${err.message}`)
    process.exit(1)
  },
)
