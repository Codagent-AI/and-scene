#!/usr/bin/env node
// Captures one settled screenshot per step from a production preview and prints advisory
// visual-quality warnings. Warnings never change the exit code: they are inspection evidence.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CheckError, HOST, ROOT, SELECTORS, launchBrowser, run, sleep, startPreview } from './lib.mjs'

const DEFAULT_VIEWPORT = '1440x900'
const USAGE = 'usage: npm run inspect -- <slug> [--settle <ms>] [--viewport <WxH>] [--mode browse|present] [--out <dir>] [--no-build]'

function parseArgs(argv) {
  const opts = { slug: undefined, settle: 1200, viewport: DEFAULT_VIEWPORT, mode: undefined, out: join(ROOT, '.presentation-inspect'), build: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--viewport') opts.viewport = argv[++i]
    else if (a === '--mode') opts.mode = argv[++i]
    else if (a === '--out') opts.out = join(ROOT, argv[++i])
    else if (a === '--no-build') opts.build = false
    else if (!a.startsWith('--') && !opts.slug) opts.slug = a
    else throw new CheckError('args', `unknown argument ${a}\n${USAGE}`)
  }
  if (!opts.slug) throw new CheckError('args', USAGE)
  const m = /^(\d+)x(\d+)$/.exec(opts.viewport)
  if (!m || !(opts.settle >= 0)) throw new CheckError('args', USAGE)
  opts.size = { width: Number(m[1]), height: Number(m[2]) }
  return opts
}

/** Runs in the page: returns advisory findings for the current (settled) step. */
function diagnose({ checkAttribution }) {
  const findings = []
  const allowed = (el) => el.closest('[data-presentation-allow-overlap]') !== null
  const visible = (el) => {
    const s = getComputedStyle(el)
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05
  }
  const label = (el) => {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return text ? `"${text}"` : `<${el.tagName.toLowerCase()}${el.getAttribute('data-presentation-dot') !== null ? ' dot' : ''}>`
  }

  // Text and chrome boxes: the extent of an element's own text, or the box of a chrome control.
  const boxes = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const textBoxes = new Map()
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim() || !n.parentElement || !visible(n.parentElement)) continue
    const range = document.createRange()
    range.selectNodeContents(n)
    const r = range.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    const prev = textBoxes.get(n.parentElement)
    textBoxes.set(n.parentElement, prev ? { l: Math.min(prev.l, r.left), t: Math.min(prev.t, r.top), r: Math.max(prev.r, r.right), b: Math.max(prev.b, r.bottom) } : { l: r.left, t: r.top, r: r.right, b: r.bottom })
  }
  for (const [el, b] of textBoxes) boxes.push({ el, ...b })
  for (const el of document.querySelectorAll('[data-presentation-dot], [data-presentation-prev], [data-presentation-next]')) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0 && visible(el)) boxes.push({ el, l: r.left, t: r.top, r: r.right, b: r.bottom })
  }

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]
      const b = boxes[j]
      if (a.el.contains(b.el) || b.el.contains(a.el) || allowed(a.el) || allowed(b.el)) continue
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l)
      const h = Math.min(a.b, b.b) - Math.max(a.t, b.t)
      if (w > 2 && h > 2) findings.push({ kind: 'overlap', message: `${label(a.el)} overlaps ${label(b.el)} (${Math.round(w)}x${Math.round(h)}px)` })
    }
  }

  // Active navigation must differ visibly from its inactive siblings.
  const props = ['backgroundColor', 'color', 'borderTopColor', 'borderLeftColor', 'borderTopWidth', 'borderLeftWidth', 'opacity', 'transform', 'fontWeight', 'boxShadow', 'outlineStyle', 'textDecorationLine']
  for (const [name, hook] of [['progress indicator', 'dot'], ['table-of-contents entry', 'toc-entry']]) {
    const items = [...document.querySelectorAll(`[data-presentation-${hook}]`)].filter(visible)
    const active = items.find((el) => el.getAttribute('data-active') === 'true' || el.getAttribute('aria-current'))
    const inactive = items.find((el) => el !== active)
    if (!active || !inactive) continue
    const a = getComputedStyle(active)
    const b = getComputedStyle(inactive)
    // Text-bearing entries differ in size by content alone, so only compare size for empty indicators.
    const sized = hook === 'dot' ? ['width', 'height'] : []
    if ([...props, ...sized].every((p) => a[p] === b[p])) {
      findings.push({ kind: 'active-nav', message: `active ${name} looks identical to inactive ones: style [data-presentation-${hook}][data-active='true'] in your presentation CSS` })
    }
  }

  if (checkAttribution) {
    const el = document.querySelector('[data-presentation-attribution]')
    if (!el) {
      findings.push({ kind: 'attribution', message: 'attribution link is missing; the kit renders [data-presentation-attribution] by default' })
    } else {
      const s = getComputedStyle(el)
      const size = parseFloat(s.fontSize)
      const problems = []
      if (size < 11) problems.push(`font-size ${size}px is too small`)
      if (s.color === 'rgb(0, 0, 238)' || s.color === 'rgb(85, 26, 139)') problems.push('uses the browser-default link color')
      if (/^"?times/i.test(s.fontFamily)) problems.push('uses the browser-default font')
      if (problems.length) findings.push({ kind: 'attribution', message: `attribution is unpolished (${problems.join(', ')}): style [data-presentation-attribution] in your presentation CSS` })
    }
  }
  return findings
}

async function inspect(opts) {
  if (opts.build) {
    console.log('[inspect] building')
    await run('npm', ['run', 'build'], 'build')
  }
  const preview = await startPreview()
  let browser
  // Non-default viewports get their own folder so they never overwrite the desktop screenshots.
  const dir = join(opts.out, opts.viewport === DEFAULT_VIEWPORT ? opts.slug : `${opts.slug}-${opts.viewport}`)
  mkdirSync(dir, { recursive: true })
  const report = { slug: opts.slug, settleMs: opts.settle, viewport: opts.size, steps: [], warnings: [] }
  try {
    browser = await launchBrowser()
    const page = await browser.newPage({ viewport: opts.size })
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${preview.base}/${opts.slug}`)
    await page.waitForSelector(SELECTORS.root, { timeout: 10000 })
    if (opts.mode && (await page.getAttribute(SELECTORS.root, 'data-mode')) !== opts.mode) await page.keyboard.press('p')
    const count = Number(await page.getAttribute(SELECTORS.root, 'data-step-count'))
    for (let i = 0; i < count; i++) {
      const pressedAt = Date.now()
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(([sel, n]) => document.querySelector(sel)?.getAttribute('data-step-index') === String(n), [SELECTORS.root, i], { timeout: 5000 })
      }
      await sleep(opts.settle)
      const file = join(dir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      report.steps.push({ step: i + 1, file, pressedAt, capturedAt: Date.now() })
      for (const f of await page.evaluate(diagnose, { checkAttribution: true })) {
        report.warnings.push({ step: i + 1, ...f })
        console.log(`[inspect] warning step ${i + 1} ${f.kind}: ${f.message}`)
      }
    }
    if (errors.length) console.log(`[inspect] warning browser errors: ${errors.join(' | ')}`)
  } finally {
    await browser?.close()
    preview.stop()
  }
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`[inspect] captured ${report.steps.length} screenshots in ${dir} via ${HOST} (${report.warnings.length} advisory warnings)`)
}

try {
  await inspect(parseArgs(process.argv.slice(2)))
} catch (e) {
  console.error(`[inspect] FAIL ${e instanceof CheckError ? `phase=${e.phase}: ${e.message}` : (e?.stack ?? e)}`)
  process.exitCode = 1
}
