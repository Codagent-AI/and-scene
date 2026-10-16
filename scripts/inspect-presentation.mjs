// Captures settled per-step screenshots of a presentation from a production preview
// and prints advisory visual-quality warnings. Warnings never change the exit code.
//
// usage: node scripts/inspect-presentation.mjs <slug> [--out dir] [--settle ms]
//        [--viewport WxH] [--no-build]
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { projectRoot, readIndex, run, startPreview, waitForIndex } from './lib.mjs'

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}
const VALUE_FLAGS = new Set(['--out', '--settle', '--viewport'])
const slug = args.find((a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(args[i - 1]))
if (!slug) {
  console.error('usage: inspect-presentation.mjs <slug> [--out dir] [--settle ms] [--viewport WxH] [--no-build]')
  process.exit(2)
}
const settle = Number(opt('settle', 1800))
const [width, height] = opt('viewport', '1280x720').split('x').map(Number)
const outDir = path.resolve(projectRoot, opt('out', '.inspection'), slug)

/** Runs in the page: returns advisory warnings for the current step. */
function diagnose() {
  const ALLOW = '[data-presentation-allow-overlap]'
  const CHROME = [
    '[data-presentation-dot]',
    '[data-presentation-prev]',
    '[data-presentation-next]',
    '[data-presentation-toc-entry]',
    '[data-presentation-attribution]',
  ].join(',')
  const visible = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false
    }
    return true
  }
  const label = (el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40)

  const items = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const el = t.parentElement
    if (!t.textContent.trim() || !el || el.closest('script,style') || !visible(el)) continue
    const range = document.createRange()
    range.selectNodeContents(t)
    const r = range.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) items.push({ el, r, name: t.textContent.trim().slice(0, 40) })
    seen.add(el)
  }
  for (const el of document.querySelectorAll(CHROME)) {
    const r = el.getBoundingClientRect()
    if (!seen.has(el) && r.width > 0 && r.height > 0 && visible(el)) items.push({ el, r, name: label(el) })
  }

  const warnings = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.el.contains(b.el) || b.el.contains(a.el) || a.el.closest(ALLOW) || b.el.closest(ALLOW)) continue
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
      if (w > 2 && h > 2) warnings.push(`overlap: "${a.name}" overlaps "${b.name}" (no allow-overlap marker)`)
    }
  }

  // Entries of different text length differ in width, so size only counts for progress dots.
  const looks = (el, withSize) => {
    const s = getComputedStyle(el)
    return ['backgroundColor', 'color', 'borderTopColor', 'borderLeftColor', 'transform', 'opacity', 'fontWeight', 'boxShadow', 'textDecorationLine', ...(withSize ? ['width', 'height'] : [])]
      .map((k) => s[k])
      .join('|')
  }
  for (const [name, sel, withSize] of [['progress indicator', '[data-presentation-dot]', true], ['table-of-contents entry', '[data-presentation-toc-entry]', false]]) {
    const active = document.querySelector(`${sel}[data-active="true"]`)
    const inactive = document.querySelector(`${sel}:not([data-active="true"])`)
    if (active && inactive && looks(active, withSize) === looks(inactive, withSize)) {
      warnings.push(`active-chrome: the active ${name} looks identical to inactive ones; style ${sel}[data-active="true"]`)
    }
  }

  const attr = document.querySelector('[data-presentation-attribution]')
  if (!attr) {
    warnings.push('attribution: missing; style the [data-presentation-attribution] hook')
  } else {
    const s = getComputedStyle(attr)
    if (parseFloat(s.fontSize) < 11) warnings.push(`attribution: too small (${s.fontSize}); style [data-presentation-attribution]`)
    if (s.color === 'rgb(0, 0, 238)') warnings.push('attribution: browser-default link styling; style [data-presentation-attribution]')
  }
  return warnings
}

async function main() {
  if (!args.includes('--no-build')) {
    const build = await run('npm', ['run', 'build'], projectRoot)
    if (build.code !== 0) throw new Error(`npm run build failed\n${build.output.slice(-2000)}`)
  }
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })

  const preview = await startPreview(projectRoot)
  let browser
  const report = []
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto(`${preview.base}/${slug}`)
    await page.waitForSelector('[data-step-count]', { timeout: 10_000 })
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        if (!(await waitForIndex(page, i))) throw new Error(`step index did not advance to ${i} (at ${await readIndex(page)})`)
      }
      await page.waitForTimeout(settle)
      const file = path.join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      const warnings = await page.evaluate(diagnose)
      report.push({ step: i + 1, file: path.relative(projectRoot, file), settleMs: settle, warnings })
      console.log(`step ${i + 1}/${count}: ${path.relative(projectRoot, file)}`)
      for (const w of warnings) console.log(`  WARN step ${i + 1}: ${w}`)
    }
  } finally {
    await browser?.close()
    preview.stop()
  }
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ slug, viewport: { width, height }, steps: report }, null, 2))
  const total = report.reduce((n, s) => n + s.warnings.length, 0)
  console.log(`inspected ${report.length} steps at ${width}x${height}; ${total} advisory warning(s) (advisory only)`)
}

main().catch((e) => {
  console.error(`inspect failed: ${e.message}`)
  process.exit(1)
})
