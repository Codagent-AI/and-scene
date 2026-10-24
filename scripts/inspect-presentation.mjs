#!/usr/bin/env node
// Captures one settled screenshot per step from a production preview and prints advisory
// visual warnings. Screenshots and warnings are inspection artifacts, not pass/fail evidence.
//   node scripts/inspect-presentation.mjs <slug> [--out dir] [--settle ms] [--viewport WxH]
//                                         [--mode initial|browse|present] [--skip-build]
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { run, sleep, startPreview, tail } from './lib/preview.mjs'

const root = path.resolve(import.meta.dirname, '..')

function parseArgs(argv) {
  const opts = { slug: undefined, out: path.join(root, '.inspection'), settle: 1200, viewport: [1440, 900], mode: 'initial', skipBuild: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--out') opts.out = path.resolve(argv[++i])
    else if (arg === '--settle') opts.settle = Number(argv[++i])
    else if (arg === '--viewport') opts.viewport = argv[++i].split('x').map(Number)
    else if (arg === '--mode') opts.mode = argv[++i]
    else if (arg === '--skip-build') opts.skipBuild = true
    else if (!arg.startsWith('--') && !opts.slug) opts.slug = arg
    else throw new Error(`unknown argument: ${arg}`)
  }
  if (!opts.slug) throw new Error('usage: inspect-presentation.mjs <slug> [--out dir] [--settle ms] [--viewport WxH] [--mode initial|browse|present] [--skip-build]')
  return opts
}

/** Runs inside the page; returns advisory warnings for the step currently on screen. */
function diagnose() {
  const warnings = []
  const label = (el, text) => {
    const entity = el.closest('[data-presentation-entity]')?.getAttribute('data-presentation-entity')
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-entity')
    const where = entity ? `#${entity}` : hook ? `[${hook.name}]` : el.tagName.toLowerCase()
    return `${where} "${(text ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`
  }
  const effectiveOpacity = (el) => {
    let o = 1
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0
      o *= parseFloat(cs.opacity)
    }
    return o
  }
  const intersects = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1

  // visible text and chrome boxes
  const items = []
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE'].includes(el.tagName) || effectiveOpacity(el) < 0.05) continue
    const textNodes = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
    if (textNodes.length) {
      const range = document.createRange()
      let box
      for (const n of textNodes) {
        range.selectNodeContents(n)
        for (const r of range.getClientRects()) {
          box = box ? { left: Math.min(box.left, r.left), top: Math.min(box.top, r.top), right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) } : { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
        }
      }
      if (box && box.right > box.left && box.bottom > box.top) items.push({ el, box, text: textNodes.map((n) => n.textContent).join(' ') })
    }
    if (el.matches('[data-presentation-chrome], [data-presentation-attribution-row]')) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) items.push({ el, box: r, chrome: true })
    }
  }
  const allowed = (el) => el.closest('[data-presentation-allow-overlap]') !== null
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.el.contains(b.el) || b.el.contains(a.el) || allowed(a.el) || allowed(b.el)) continue
      if (intersects(a.box, b.box)) warnings.push({ kind: 'overlap', message: `${label(a.el, a.text)} overlaps ${label(b.el, b.text)}` })
    }
  }

  // active navigation must look different from inactive navigation
  const props = ['color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderTopStyle', 'opacity', 'fontWeight', 'fontStyle', 'textDecorationLine', 'boxShadow', 'outlineStyle']
  for (const [name, selector] of [['progress indicator', '[data-presentation-dot]'], ['table-of-contents entry', '[data-presentation-toc-entry]']]) {
    const active = document.querySelector(`${selector}[data-presentation-active="true"]`)
    const inactive = document.querySelector(`${selector}:not([data-presentation-active="true"])`)
    if (!active || !inactive) continue
    const a = getComputedStyle(active)
    const b = getComputedStyle(inactive)
    if (props.every((p) => a[p] === b[p])) {
      warnings.push({ kind: 'active-chrome', message: `active ${name} looks the same as inactive ones; style [data-presentation-active="true"] on ${selector}` })
    }
  }

  // attribution must be legible and intentionally styled
  const link = document.querySelector('[data-presentation-attribution]')
  if (!link) {
    warnings.push({ kind: 'attribution', message: 'attribution is missing; the kit renders it unless attribution={false}' })
  } else {
    const cs = getComputedStyle(link)
    const probe = document.createElement('a')
    probe.href = '#'
    probe.textContent = 'probe'
    link.parentElement.appendChild(probe)
    const base = getComputedStyle(probe)
    const same = ['color', 'fontSize', 'fontFamily', 'fontWeight', 'textDecorationLine', 'backgroundColor', 'paddingLeft', 'borderBottomWidth', 'letterSpacing'].every((p) => cs[p] === base[p])
    probe.remove()
    const size = parseFloat(cs.fontSize)
    if (size < 11) warnings.push({ kind: 'attribution', message: `attribution is too small (${size}px); style [data-presentation-attribution]` })
    else if (same) warnings.push({ kind: 'attribution', message: 'attribution looks browser-default; style [data-presentation-attribution]' })
  }
  return warnings
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (!opts.skipBuild) {
    const { code, output } = await run('npm', ['run', 'build'], { cwd: root })
    if (code !== 0) throw new Error(`npm run build exited ${code}\n${tail(output)}`)
  }
  const dir = path.join(opts.out, opts.slug)
  await mkdir(dir, { recursive: true })
  const preview = await startPreview(root)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: opts.viewport[0], height: opts.viewport[1] } })
    const sel = '[data-presentation-root]'
    await page.goto(`${preview.url}/${opts.slug}`)
    await page.waitForSelector(sel, { timeout: 15_000 })
    if (opts.mode !== 'initial' && (await page.getAttribute(sel, 'data-presentation-mode')) !== opts.mode) await page.keyboard.press('p')
    const count = Number(await page.getAttribute(sel, 'data-step-count'))
    const steps = []
    const grouped = new Map()
    let navigatedAt = Date.now()
    for (let i = 0; i < count; i++) {
      await sleep(opts.settle)
      const file = path.join(dir, `step-${String(i + 1).padStart(2, '0')}.png`)
      for (const w of await page.evaluate(diagnose)) {
        const key = `${w.kind}:${w.kind === 'overlap' ? `${i}:` : ''}${w.message}`
        if (!grouped.has(key)) grouped.set(key, { kind: w.kind, message: w.message, steps: [] })
        grouped.get(key).steps.push(i + 1)
      }
      await page.screenshot({ path: file })
      steps.push({ step: i + 1, file: path.relative(root, file), navigatedAt, capturedAt: Date.now() })
      if (i < count - 1) {
        await page.keyboard.press('ArrowRight')
        navigatedAt = Date.now()
        await page.waitForFunction(([s, n]) => document.querySelector(s)?.getAttribute('data-step-index') === String(n), [sel, i + 1], { timeout: 4000 })
      }
    }
    const warnings = [...grouped.values()]
    await writeFile(path.join(dir, 'report.json'), JSON.stringify({ slug: opts.slug, viewport: opts.viewport, settleMs: opts.settle, steps, warnings }, null, 2))
    console.log(`[inspect] ${count} screenshots in ${path.relative(root, dir)}`)
    for (const w of warnings) console.log(`[inspect] WARN ${w.kind} (step ${w.steps.join(', ')}): ${w.message}`)
    if (!warnings.length) console.log('[inspect] no advisory warnings')
  } finally {
    await browser.close()
    await preview.stop()
  }
}

main().catch((error) => {
  console.error(`[inspect] ERROR ${error.message}`)
  process.exitCode = 1
})
