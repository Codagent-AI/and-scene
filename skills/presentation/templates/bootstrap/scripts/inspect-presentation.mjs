// Screenshot capture and advisory visual-quality diagnostics for one presentation.
// Usage: node scripts/inspect-presentation.mjs <slug> [--out <dir>] [--settle <ms>]
//        [--viewport <WxH>] [--build]
// Screenshots go to <out>/step-NN.png (default inspection/<slug>/) with a manifest.json.
// Warnings are advisory: the exit code is non-zero only when inspection itself fails.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium, run, startPreview } from './lib/preview.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ROOT_SEL = '[data-presentation-root]'

function parseArgs(argv) {
  const opts = { slug: null, out: null, settle: 1200, viewport: '1440x900', build: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') opts.out = argv[++i]
    else if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--viewport') opts.viewport = argv[++i]
    else if (a === '--build') opts.build = true
    else if (!a.startsWith('--') && !opts.slug) opts.slug = a
    else throw new Error(`unknown argument: ${a}`)
  }
  if (!opts.slug) throw new Error('usage: inspect-presentation.mjs <slug> [--out dir] [--settle ms] [--viewport WxH] [--build]')
  const m = /^(\d+)x(\d+)$/.exec(opts.viewport)
  if (!m || !(opts.settle >= 0)) throw new Error('invalid --viewport or --settle')
  opts.size = { width: Number(m[1]), height: Number(m[2]) }
  opts.out = path.resolve(root, opts.out ?? path.join('inspection', opts.slug))
  return opts
}

/** Runs inside the page: returns advisory warnings for the settled step. */
function diagnose() {
  const warnings = []
  const rootEl = document.querySelector('[data-presentation-root]')
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active')
    const id = el.getAttribute('data-presentation-id')
    const label = id ? `#${id}` : hook ? `[${hook.name}]` : el.tagName.toLowerCase()
    const t = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return t ? `${label} "${t}"` : label
  }
  const hidden = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return true
    }
    return false
  }
  const allowed = (el) => el.closest('[data-presentation-allow-overlap]') !== null

  // 1. visible text / chrome boxes that overlap without an allow-overlap marker
  const chromeSel = [
    'marker', 'deck-title', 'step-title', 'caption', 'prev', 'next', 'dots', 'toc', 'attribution',
  ].map((n) => `[data-presentation-${n}]`).join(',')
  const chrome = new Set(rootEl.querySelectorAll(chromeSel))
  const boxes = []
  for (const el of rootEl.querySelectorAll('*')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    const isChrome = chrome.has(el)
    if (!own.length && !isChrome) continue
    if (hidden(el)) continue
    let rect
    if (isChrome) rect = el.getBoundingClientRect()
    else {
      const range = document.createRange()
      range.setStartBefore(own[0])
      range.setEndAfter(own[own.length - 1])
      rect = range.getBoundingClientRect()
    }
    if (rect.width > 0 && rect.height > 0) boxes.push({ el, rect })
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]
      const b = boxes[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      if (allowed(a.el) || allowed(b.el)) continue
      const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (w > 2 && h > 2) warnings.push(`overlap: ${describe(a.el)} overlaps ${describe(b.el)}`)
    }
  }

  // 2. active navigation that looks like its inactive siblings
  const props = ['color', 'backgroundColor', 'borderTopColor', 'borderLeftColor', 'borderTopWidth',
    'opacity', 'fontWeight', 'width', 'height', 'boxShadow', 'textDecorationLine', 'transform', 'outlineStyle']
  for (const name of ['dot', 'toc-entry']) {
    const items = [...rootEl.querySelectorAll(`[data-presentation-${name}]`)]
    if (items.length < 2) continue
    const active = items.find((el) => el.getAttribute('data-presentation-active') === 'true' || el.hasAttribute('aria-current'))
    if (!active) {
      warnings.push(`indistinct-active: no ${name} is marked as the active step`)
      continue
    }
    const inactive = items.filter((el) => el !== active)
    const as = getComputedStyle(active)
    const same = inactive.every((el) => {
      const s = getComputedStyle(el)
      return props.every((p) => s[p] === as[p])
    })
    if (same) {
      warnings.push(`indistinct-active: the active ${name} looks the same as inactive ones; style [data-presentation-active="true"]`)
    }
  }

  // 3. attribution that is missing, browser-default, or too small
  const attr = rootEl.querySelector('[data-presentation-attribution]')
  if (!attr) warnings.push('attribution: no [data-presentation-attribution] link is rendered')
  else {
    const cs = getComputedStyle(attr)
    const size = parseFloat(cs.fontSize)
    if (size < 11) warnings.push(`attribution: font size ${size}px is too small; style [data-presentation-attribution]`)
    if (cs.color === 'rgb(0, 0, 238)' || cs.color === 'rgb(85, 26, 139)') {
      warnings.push('attribution: link uses the browser-default style; style [data-presentation-attribution]')
    }
  }
  return warnings
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.build || !existsSync(path.join(root, 'dist', 'index.html'))) {
    if ((await run('npm', ['run', 'build'], { cwd: root, quiet: true })) !== 0) throw new Error('npm run build failed')
  }
  mkdirSync(opts.out, { recursive: true })
  const preview = await startPreview(root)
  let browser
  try {
    browser = await launchChromium()
    const page = await browser.newPage({ viewport: opts.size })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(`console error: ${m.text()}`))
    await page.goto(`${preview.baseUrl}/${opts.slug}`)
    await page.waitForSelector(ROOT_SEL, { timeout: 10_000 })
    const count = Number(await page.getAttribute(ROOT_SEL, 'data-step-count'))
    const manifest = { slug: opts.slug, viewport: opts.size, settleMs: opts.settle, steps: [] }
    let navigatedAt = Date.now()
    for (let i = 0; i < count; i++) {
      await page.waitForTimeout(opts.settle)
      await page.evaluate(() => Promise.allSettled(document.getAnimations().map((a) => a.finished)))
      const capturedAt = Date.now()
      const n = String(i + 1).padStart(2, '0')
      const file = `step-${n}.png`
      await page.screenshot({ path: path.join(opts.out, file) })
      const warnings = await page.evaluate(diagnose)
      for (const w of warnings) console.log(`WARN step ${i + 1}: ${w}`)
      manifest.steps.push({ step: i + 1, file, navigatedAt, capturedAt, warnings })
      if (i < count - 1) {
        navigatedAt = Date.now()
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          ([sel, next]) => document.querySelector(sel)?.getAttribute('data-step-index') === String(next),
          [ROOT_SEL, i + 1],
          { timeout: 4000 },
        )
      }
    }
    if (errors.length) throw new Error(`page error: ${errors[0]}`)
    writeFileSync(path.join(opts.out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    const total = manifest.steps.reduce((s, x) => s + x.warnings.length, 0)
    console.log(`inspected ${count} steps of ${opts.slug}: ${total} advisory warning(s); screenshots in ${path.relative(root, opts.out)}`)
  } finally {
    await browser?.close()
    preview.stop()
  }
}

main().catch((err) => {
  console.error(`inspect failed: ${err.message}`)
  process.exit(1)
})
