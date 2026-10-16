// Visual inspection helper: settled per-step screenshots plus advisory warnings. Never fails on warnings.
// Usage: npm run inspect -- <slug> [--viewport 1440x900] [--settle 1200] [--out dir] [--skip-build]
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { ROOT, STEP_HOOK, advance, readRegistry, runBuild, startPreview, stepCount } from './lib.mjs'

const DEFAULT_VIEWPORT = '1440x900'

function parseArgs(argv) {
  const opts = { slug: undefined, viewport: DEFAULT_VIEWPORT, settle: 1200, out: undefined, skipBuild: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--viewport') opts.viewport = argv[++i]
    else if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--out') opts.out = argv[++i]
    else if (a === '--skip-build') opts.skipBuild = true
    else if (!a.startsWith('--')) opts.slug = a
  }
  return opts
}

/** Runs in the page. Returns advisory warnings for the currently settled step. */
function diagnose() {
  const CHROME =
    '[data-presentation-dot],[data-presentation-mode-toggle],[data-presentation-prev],[data-presentation-next],[data-presentation-toc-entry],[data-presentation-attribution]'
  const warnings = []
  const hidden = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return true
    }
    return false
  }
  const label = (el, text) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))
    const name = hook ? `[${hook.name}${hook.value && hook.value !== 'true' ? `="${hook.value}"` : ''}]` : el.tagName.toLowerCase()
    const t = (text ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return t ? `${name} "${t}"` : name
  }

  const items = []
  const vw = window.innerWidth
  const vh = window.innerHeight
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue
    const chrome = el.matches(CHROME)
    if (!chrome && el.parentElement?.closest(CHROME)) continue
    let rect = null
    let text = ''
    if (chrome) {
      rect = el.getBoundingClientRect()
    } else {
      const nodes = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
      if (!nodes.length) continue
      const range = document.createRange()
      range.setStartBefore(nodes[0])
      range.setEndAfter(nodes[nodes.length - 1])
      rect = range.getBoundingClientRect()
      text = nodes.map((n) => n.textContent).join(' ')
    }
    if (rect.width < 1 || rect.height < 1 || rect.right < 0 || rect.bottom < 0 || rect.left > vw || rect.top > vh) continue
    if (hidden(el)) continue
    items.push({ el, rect, text, allowed: !!el.closest('[data-presentation-allow-overlap]') })
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed || a.el.contains(b.el) || b.el.contains(a.el)) continue
      const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (w > 2 && h > 2) warnings.push(`overlap: ${label(a.el, a.text)} collides with ${label(b.el, b.text)}`)
    }
  }

  const PROPS = ['backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'opacity', 'fontWeight', 'textDecorationLine', 'boxShadow', 'outlineStyle', 'width', 'height', 'transform']
  const signature = (el) => PROPS.map((p) => getComputedStyle(el)[p]).join('|')
  for (const [group, noun] of [
    ['[data-presentation-progress] [data-presentation-dot]', 'progress indicator'],
    ['[data-presentation-toc] [data-presentation-toc-entry]', 'table-of-contents entry'],
  ]) {
    const all = [...document.querySelectorAll(group)].filter((el) => !hidden(el))
    if (!all.length) continue
    const active = all.filter((el) => el.hasAttribute('data-presentation-active') && el.getAttribute('aria-current'))
    const inactive = all.filter((el) => !active.includes(el))
    if (!active.length) warnings.push(`active chrome: no ${noun} exposes both aria-current and [data-presentation-active]`)
    else if (inactive.length && inactive.every((el) => signature(el) === signature(active[0]))) {
      warnings.push(`active chrome: the active ${noun} looks identical to inactive ones; style [data-presentation-active]`)
    }
  }

  const attr = document.querySelector('[data-presentation-attribution]')
  if (!attr) warnings.push('attribution: no [data-presentation-attribution] link is rendered')
  else {
    const cs = getComputedStyle(attr)
    const r = attr.getBoundingClientRect()
    const why = []
    if (hidden(attr)) why.push('hidden')
    if (parseFloat(cs.fontSize) < 11) why.push(`undersized (${cs.fontSize})`)
    if (r.width < 30 || r.height < 10) why.push('tiny box')
    if (cs.color === 'rgb(0, 0, 238)' || cs.color === 'rgb(85, 26, 139)') why.push('browser-default link color')
    if (cs.fontFamily.startsWith('"Times New Roman"')) why.push('browser-default font')
    if (why.length) warnings.push(`attribution: ${why.join(', ')}; style [data-presentation-attribution]`)
  }
  return warnings
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (!opts.slug) throw new Error('usage: npm run inspect -- <slug> [--viewport 1440x900] [--settle ms] [--out dir] [--skip-build]')
  if (!readRegistry().includes(opts.slug)) throw new Error(`"${opts.slug}" is not registered in src/presentations/index.ts`)
  const [width, height] = opts.viewport.split('x').map(Number)
  if (!(width > 0 && height > 0)) throw new Error(`invalid --viewport "${opts.viewport}"`)

  if (!opts.skipBuild) {
    const res = runBuild()
    if (res.status !== 0) {
      process.stdout.write(`${res.stdout ?? ''}${res.stderr ?? ''}`)
      throw new Error('npm run build failed')
    }
  }
  const outDir =
    opts.out ?? path.join(ROOT, '.presentation-artifacts', opts.slug, opts.viewport === DEFAULT_VIEWPORT ? '' : opts.viewport)
  mkdirSync(outDir, { recursive: true })

  const preview = await startPreview()
  let browser
  let total = 0
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: false })
    await page.goto(`${preview.base}/${opts.slug}`, { waitUntil: 'load' })
    await page.waitForSelector(STEP_HOOK, { timeout: 8000 })
    const count = await stepCount(page)
    for (let i = 0; i < count; i++) {
      if (i > 0) await advance(page, i)
      await page.waitForTimeout(opts.settle)
      const file = path.join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      const title = (await page.textContent('[data-presentation-title]'))?.trim() ?? ''
      console.log(`[inspect] step ${i + 1}/${count} "${title}" -> ${file}`)
      for (const w of await page.evaluate(diagnose)) {
        total++
        console.log(`[inspect] WARN step ${i + 1}: ${w}`)
      }
    }
  } finally {
    await browser?.close()
    preview.stop()
  }
  console.log(`[inspect] done: ${total} advisory warning(s); screenshots in ${outDir}`)
}

main().catch((err) => {
  console.error(`[inspect] ERROR: ${err.message}`)
  process.exitCode = 1
})
