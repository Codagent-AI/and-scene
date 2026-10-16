#!/usr/bin/env node
// Visual inspection helper: builds, serves a production preview on 127.0.0.1,
// captures one settled screenshot per step, and prints advisory diagnostics
// (text/chrome overlap, indistinct active navigation, unpolished attribution).
// Screenshots and warnings are review artifacts, not pass/fail evidence.
//
// usage: npm run inspect -- <slug> [--narrow] [--viewport WxH] [--settle ms] [--out dir] [--no-build]
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadChromium, startPreview } from './lib/preview.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const NARROW = { width: 390, height: 844 }
const DESKTOP = { width: 1280, height: 720 }
const DEFAULT_SETTLE_MS = 2000

function parseArgs(argv) {
  const opts = { slug: undefined, viewport: DESKTOP, narrow: false, settle: DEFAULT_SETTLE_MS, out: undefined, build: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--narrow') {
      opts.narrow = true
      opts.viewport = NARROW
    } else if (a === '--viewport') {
      const [width, height] = argv[++i].split('x').map(Number)
      opts.viewport = { width, height }
    } else if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--out') opts.out = path.resolve(argv[++i])
    else if (a === '--no-build') opts.build = false
    else if (!a.startsWith('--')) opts.slug = a
    else throw new Error(`unknown option ${a}`)
  }
  if (!opts.slug) throw new Error('usage: inspect-presentation <slug> [--narrow] [--viewport WxH] [--settle ms] [--out dir] [--no-build]')
  opts.out ??= path.join(root, '.inspect', opts.narrow ? `${opts.slug}-narrow` : opts.slug)
  return opts
}

/** Runs in the page: returns advisory findings for the active step. */
function diagnose() {
  const findings = []
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name === 'data-presentation-id') ??
      [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))
    return hook ? `<${el.tagName.toLowerCase()} ${hook.name}${hook.value ? `="${hook.value}"` : ''}>` : `<${el.tagName.toLowerCase()}>`
  }
  const visible = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false
    }
    return true
  }

  // 1. Overlapping visible text / chrome without an allow-overlap marker.
  const items = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim()
    const el = node.parentElement
    if (!text || !el || el.closest('script,style') || !visible(el)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const r = range.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    items.push({ el, text, r, allowed: el.closest('[data-presentation-allow-overlap]') !== null })
  }
  const chrome = document.querySelectorAll('[data-presentation-header] button, [data-presentation-footer] button, [data-presentation-toc-entry], [data-presentation-dot], [data-presentation-attribution]')
  for (const el of chrome) {
    if (!visible(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width >= 1 && r.height >= 1) items.push({ el, text: el.textContent.trim() || el.getAttribute('aria-label') || '', r, allowed: false, chrome: true })
  }
  const seen = new Set()
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed || a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
      if (w <= 2 || h <= 2) continue
      const key = `${describe(a.el)}|${describe(b.el)}`
      if (seen.has(key)) continue
      seen.add(key)
      findings.push({
        kind: 'overlap',
        message: `visible text/chrome overlap between ${describe(a.el)} "${a.text.slice(0, 30)}" and ${describe(b.el)} "${b.text.slice(0, 30)}" (mark intentional readable overlap with data-presentation-allow-overlap)`,
      })
    }
  }

  // 2. Active progress / table-of-contents state must look different from inactive.
  const props = ['backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'fontWeight', 'opacity', 'boxShadow', 'textDecorationLine', 'outlineStyle', 'transform']
  // Text-sized controls differ in width by content alone; only icon-like (textless) ones compare size.
  const styleKey = (el) => {
    const cs = getComputedStyle(el)
    const size = el.textContent.trim() ? '' : `${cs.width}x${cs.height}`
    return [...props.map((p) => cs[p]), size].join('|')
  }
  for (const [label, selector] of [['progress indicator', '[data-presentation-dot]'], ['table-of-contents entry', '[data-presentation-toc-entry]']]) {
    const all = [...document.querySelectorAll(selector)]
    const active = all.find((e) => e.getAttribute('data-presentation-active') === 'true')
    const inactive = all.filter((e) => e !== active)
    if (active && inactive.length && inactive.every((e) => styleKey(e) === styleKey(active))) {
      findings.push({ kind: 'active-chrome', message: `active ${label} is visually indistinct from inactive ones; style [data-presentation-active="true"]` })
    }
  }

  // 3. Attribution polish.
  const attr = document.querySelector('[data-presentation-attribution]')
  if (attr) {
    const cs = getComputedStyle(attr)
    const size = parseFloat(cs.fontSize)
    if (size < 12) findings.push({ kind: 'attribution', message: `attribution is undersized (${size}px); style [data-presentation-attribution]` })
    if (cs.color === 'rgb(0, 0, 238)') findings.push({ kind: 'attribution', message: 'attribution uses the browser-default link color; style [data-presentation-attribution]' })
  } else {
    findings.push({ kind: 'attribution', message: 'attribution link is missing; the kit renders [data-presentation-attribution] by default' })
  }
  return findings
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.build) {
    const res = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
    if (res.status !== 0) throw new Error('npm run build failed')
  }
  rmSync(opts.out, { recursive: true, force: true })
  mkdirSync(opts.out, { recursive: true })

  const chromium = await loadChromium(root)
  const preview = await startPreview(root)
  let browser
  const warnings = []
  const captures = []
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] })
    const page = await browser.newPage({ viewport: opts.viewport })
    await page.goto(`${preview.origin}/${opts.slug}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-presentation-root]', { timeout: 10_000 })
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    for (let step = 0; step < count; step++) {
      const advancedAt = Date.now()
      await page.waitForTimeout(opts.settle)
      const file = path.join(opts.out, `step-${String(step + 1).padStart(2, '0')}.png`)
      const capturedAt = Date.now()
      await page.screenshot({ path: file })
      const id = await page.getAttribute('[data-presentation-root]', 'data-step-id')
      for (const f of await page.evaluate(diagnose)) {
        const line = `WARN step ${step + 1} (${id}) [${f.kind}]: ${f.message}`
        warnings.push(line)
        console.warn(line)
      }
      captures.push({ step: step + 1, id, file: path.relative(root, file), advancedAt, capturedAt, settleMs: capturedAt - advancedAt })
      if (step < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n), step + 1, { timeout: 5_000 })
      }
    }
    writeFileSync(path.join(opts.out, 'report.json'), JSON.stringify({ slug: opts.slug, viewport: opts.viewport, settle: opts.settle, captures, warnings }, null, 2))
    console.log(`[inspect] ${count} screenshots in ${path.relative(root, opts.out)} (${warnings.length} advisory warning${warnings.length === 1 ? '' : 's'})`)
  } finally {
    await browser?.close()
    preview.stop()
  }
}

main().catch((err) => {
  console.error(`[inspect] ${err.message}`)
  process.exitCode = 1
})
