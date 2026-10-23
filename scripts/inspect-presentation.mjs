#!/usr/bin/env node
// Capture one settled screenshot per step from a production preview and print
// advisory visual warnings. Usage:
//   npm run inspect -- <slug> [--out dir] [--settle ms] [--viewport WxH] [--mode present|browse] [--skip-build]
// Screenshots and report.json are inspection artifacts, not pass/fail evidence.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { Fail, readRegistry, runBuild, startPreview } from './lib/preview.mjs'

const DEFAULTS = { settle: 1000, viewport: '1440x900' }

function parseArgs(argv) {
  const options = {
    slug: null,
    skipBuild: false,
    settle: DEFAULTS.settle,
    viewport: DEFAULTS.viewport,
    mode: null,
    out: null,
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--skip-build') options.skipBuild = true
    else if (arg === '--settle') options.settle = Number(argv[++i])
    else if (arg === '--viewport') options.viewport = argv[++i]
    else if (arg === '--mode') options.mode = argv[++i]
    else if (arg === '--out') options.out = path.resolve(argv[++i])
    else if (arg === '--root') options.root = path.resolve(argv[++i])
    else if (!arg.startsWith('--')) options.slug = arg
  }
  return options
}

/** Runs in the page: returns advisory warnings for the current step. */
function diagnose() {
  const warnings = []
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook.name}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const visible = (el) =>
    el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })

  // 1. Unmarked overlap between visible text / chrome elements.
  const items = []
  const chromeSelector =
    '[data-presentation-prev], [data-presentation-next], [data-presentation-progress-item], [data-presentation-mode-toggle], [data-presentation-attribution]'
  const all = document.querySelectorAll('body *')
  for (const el of all) {
    if (!visible(el) || el.closest('svg')) continue
    if (el.closest('[data-presentation-allow-overlap]')) continue
    let rect = null
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '')
    if (hasText) {
      const range = document.createRange()
      range.selectNodeContents(el)
      rect = range.getBoundingClientRect()
    } else if (el.matches(chromeSelector)) {
      rect = el.getBoundingClientRect()
    }
    if (rect && rect.width > 1 && rect.height > 1) items.push({ el, rect })
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (w > 2 && h > 2) {
        warnings.push({ kind: 'overlap', message: `${describe(a.el)} overlaps ${describe(b.el)}` })
      }
    }
  }

  // 2. Active navigation indistinguishable from inactive siblings.
  const signature = (el) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return [
      s.color, s.backgroundColor, s.borderTopColor, s.borderTopWidth, s.opacity, s.fontWeight,
      s.textDecorationLine, s.boxShadow, s.outlineStyle, s.transform, s.borderRadius,
      Math.round(r.width), Math.round(r.height),
    ].join('|')
  }
  for (const [label, itemSelector] of [
    ['progress indicator', '[data-presentation-progress-item]'],
    ['table-of-contents entry', '[data-presentation-toc-item]'],
  ]) {
    const nodes = [...document.querySelectorAll(itemSelector)].filter(visible)
    const active = nodes.find((n) => n.getAttribute('aria-current') === 'step')
    const inactive = nodes.filter((n) => n !== active)
    if (active && inactive.length > 0 && inactive.every((n) => signature(n) === signature(active))) {
      warnings.push({
        kind: 'active-chrome',
        message: `active ${label} is visually indistinguishable from inactive ones (style it with [data-presentation-active])`,
      })
    }
  }

  // 3. Unpolished attribution.
  const link = document.querySelector('[data-presentation-attribution]')
  if (!link) {
    warnings.push({ kind: 'attribution', message: 'no [data-presentation-attribution] link is rendered' })
  } else {
    const style = getComputedStyle(link)
    const frame = document.createElement('iframe')
    document.body.append(frame)
    const probe = frame.contentDocument.createElement('a')
    probe.href = '#'
    probe.textContent = link.textContent
    frame.contentDocument.body.append(probe)
    const base = frame.contentWindow.getComputedStyle(probe)
    const same = ['color', 'textDecorationLine', 'backgroundColor'].every(
      (p) => style[p] === base[p],
    )
    frame.remove()
    if (parseFloat(style.fontSize) < 11) {
      warnings.push({
        kind: 'attribution',
        message: `attribution link is too small (${style.fontSize}); style [data-presentation-attribution]`,
      })
    }
    if (same) {
      warnings.push({
        kind: 'attribution',
        message: 'attribution link uses browser-default link styling; style [data-presentation-attribution]',
      })
    }
  }
  return warnings
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const { root } = options
  const registry = readRegistry(root)
  const slug = options.slug ?? registry[0]?.slug
  if (!slug || !registry.some((entry) => entry.slug === slug)) {
    throw new Fail('inspect', `unknown presentation "${slug}"; registered: ${registry.map((e) => e.slug).join(', ') || 'none'}`)
  }
  const [width, height] = options.viewport.split('x').map(Number)
  const out = options.out ?? path.join(root, 'inspection', slug)
  mkdirSync(out, { recursive: true })

  if (!options.skipBuild) {
    const build = await runBuild(root)
    if (build.code !== 0) throw new Fail('build', `npm run build exited ${build.code}\n${build.output.trim()}`)
  }

  const preview = await startPreview(root)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width, height } })
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.goto(`${preview.url}/${slug}`)
    await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    if (options.mode) {
      const current = await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')
      if (current !== options.mode) await page.keyboard.press('p')
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    const report = { slug, viewport: { width, height }, settleMs: options.settle, steps: [] }
    let warningCount = 0
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (expected) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(expected),
          i,
        )
      }
      await page.waitForTimeout(options.settle)
      const file = path.join(out, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      const warnings = await page.evaluate(diagnose)
      warningCount += warnings.length
      for (const warning of warnings) console.log(`WARN step ${i + 1} [${warning.kind}] ${warning.message}`)
      report.steps.push({ index: i + 1, file: path.relative(root, file), settledMs: options.settle, warnings })
    }
    report.pageErrors = pageErrors
    writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n')
    console.log(`inspect: ${count} screenshots in ${path.relative(root, out) || out}; ${warningCount} advisory warning(s)`)
  } finally {
    await browser.close()
    await preview.stop()
  }
}

main().catch((error) => {
  if (error instanceof Fail) console.error(`FAIL inspect [${error.phase}]: ${error.message}`)
  else console.error(`FAIL inspect [internal]: ${error?.stack ?? error}`)
  process.exit(1)
})
