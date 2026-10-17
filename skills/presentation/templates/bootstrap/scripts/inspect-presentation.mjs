#!/usr/bin/env node
// Capture settled per-step screenshots of a registered presentation from a production preview
// and print advisory visual warnings. Usage:
//   npm run inspect -- <slug> [--out <dir>] [--settle <ms>] [--viewport <WxH>] [--mode browse|present]
//                             [--skip-build] [--report <file.json>]
// Warnings are advisory: they never change the exit code.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { launchBrowser, projectRoot, registeredSlugs, runBuild, startPreview } from './lib/preview.mjs'

const root = projectRoot(import.meta.url)

function parseArgs(argv) {
  const opts = { slug: null, out: null, settle: 1200, viewport: '1280x720', mode: null, skipBuild: false, report: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--skip-build') opts.skipBuild = true
    else if (arg === '--out') opts.out = argv[++i]
    else if (arg === '--settle') opts.settle = Number(argv[++i])
    else if (arg === '--viewport') opts.viewport = argv[++i]
    else if (arg === '--mode') opts.mode = argv[++i]
    else if (arg === '--report') opts.report = argv[++i]
    else if (!arg.startsWith('--')) opts.slug = arg
    else throw new Error(`unknown option ${arg}`)
  }
  return opts
}

/** Runs in the page: returns advisory warnings for the active step. */
function diagnose() {
  const describe = (el) => {
    const id = el.closest('[data-presentation-id]')?.getAttribute('data-presentation-id')
    const hook = [...el.attributes].map((a) => a.name).find((n) => n.startsWith('data-presentation-'))
    const label = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook}` : ''}${id ? ` id=${id}` : ''}>${label ? ` "${label}"` : ''}`
  }
  const visible = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  const warnings = []

  // Overlap between visible text or chrome elements.
  const items = []
  for (const el of document.body.querySelectorAll('*')) {
    if (!visible(el)) continue
    let rect = null
    if (el.hasAttribute('data-presentation-chrome')) {
      rect = el.getBoundingClientRect()
    } else {
      const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
      if (own.length) {
        const range = document.createRange()
        range.setStartBefore(own[0])
        range.setEndAfter(own[own.length - 1])
        rect = range.getBoundingClientRect()
      }
    }
    if (rect && rect.width > 0 && rect.height > 0) items.push({ el, rect })
  }
  const allowed = (el) => el.closest('[data-presentation-allow-overlap]')
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.el.contains(b.el) || b.el.contains(a.el) || allowed(a.el) || allowed(b.el)) continue
      const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (w > 2 && h > 2) warnings.push({ kind: 'overlap', message: `${describe(a.el)} overlaps ${describe(b.el)}` })
    }
  }

  // Active chrome must look different from inactive chrome.
  const props = ['color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderTopStyle', 'borderLeftColor',
    'borderLeftWidth', 'opacity', 'fontWeight', 'textDecorationLine', 'boxShadow', 'transform', 'outlineStyle']
  // Progress indicators have fixed boxes, so size differences count; ToC entries size to their labels, so they do not.
  const progressProps = [...props, 'width', 'height']
  for (const [name, selector, compared] of [
    ['progress', '[data-presentation-progress-item]', progressProps],
    ['table of contents', '[data-presentation-toc-item]', props],
  ]) {
    const all = [...document.querySelectorAll(selector)]
    const active = all.find((el) => el.getAttribute('data-presentation-active') === 'true')
    const inactive = all.find((el) => el.getAttribute('data-presentation-active') !== 'true')
    if (!active || !inactive) continue
    const a = getComputedStyle(active)
    const b = getComputedStyle(inactive)
    if (compared.every((p) => a[p] === b[p])) {
      warnings.push({ kind: 'active-chrome', message: `active ${name} item ${describe(active)} is indistinct from inactive items; style [data-presentation-active="true"]` })
    }
  }

  // Attribution should be present, legible and styled.
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    warnings.push({ kind: 'attribution', message: 'attribution link [data-presentation-attribution] is missing' })
  } else {
    const style = getComputedStyle(attribution)
    if (parseFloat(style.fontSize) < 11) {
      warnings.push({ kind: 'attribution', message: `attribution is too small (${style.fontSize}); style [data-presentation-attribution]` })
    }
    if (style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline')) {
      warnings.push({ kind: 'attribution', message: 'attribution uses the browser-default link style; style [data-presentation-attribution]' })
    }
  }
  return warnings
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (!opts.slug) throw new Error('usage: npm run inspect -- <slug> [options]')
  if (!registeredSlugs(root).includes(opts.slug)) throw new Error(`"${opts.slug}" is not registered in src/presentations/index.ts`)
  const [width, height] = opts.viewport.split('x').map(Number)
  const outDir = path.resolve(root, opts.out ?? path.join('inspection', opts.slug))

  if (!opts.skipBuild) {
    const build = await runBuild(root)
    if (!build.ok) throw new Error(`npm run build failed\n${build.output}`)
  }
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  const preview = await startPreview(root)
  const browser = await launchBrowser(root)
  const report = []
  let warningCount = 0
  try {
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto(`${preview.origin}/${opts.slug}`)
    await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    const modeNow = () => page.locator('[data-presentation-mode]').first().getAttribute('data-presentation-mode')
    if (opts.mode && (await modeNow()) !== opts.mode) await page.keyboard.press('p')
    const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
    for (let i = 0; i < count; i++) {
      const navigatedAt = Date.now()
      await page.waitForTimeout(opts.settle)
      const capturedAt = Date.now()
      const file = path.join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      report.push({ step: i + 1, navigatedAt, capturedAt, settleMs: capturedAt - navigatedAt, file })
      for (const w of await page.evaluate(diagnose)) {
        warningCount++
        console.log(`WARN [${w.kind}] step ${i + 1}: ${w.message}`)
      }
      if (i < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((n) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(n), i + 1, { timeout: 5000 })
      }
    }
  } finally {
    await browser.close()
    preview.stop()
  }
  if (opts.report) writeFileSync(path.resolve(root, opts.report), JSON.stringify(report, null, 2))
  console.log(`inspected ${readdirSync(outDir).length} steps of ${opts.slug} into ${path.relative(root, outDir)}; ${warningCount} advisory warning(s)`)
}

main().catch((error) => {
  console.error(`inspect failed: ${error.message}`)
  process.exit(1)
})
