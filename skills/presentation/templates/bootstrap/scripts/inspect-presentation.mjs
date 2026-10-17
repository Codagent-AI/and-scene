#!/usr/bin/env node
// Captures settled per-step screenshots from a production preview and prints advisory visual warnings.
// Usage: npm run inspect -- <slug> [--narrow] [--settle <ms>] [--out <dir>] [--no-build]
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium, runCommand, startPreview } from './lib/preview.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DESKTOP = { width: 1440, height: 900 }
const NARROW = { width: 390, height: 844 }
const DEFAULT_SETTLE_MS = 1800

function parseArgs(argv) {
  const options = { slug: undefined, narrow: false, settle: DEFAULT_SETTLE_MS, out: undefined, build: true }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--narrow') options.narrow = true
    else if (arg === '--no-build') options.build = false
    else if (arg === '--settle') options.settle = Number(argv[++i])
    else if (arg === '--out') options.out = argv[++i]
    else if (!arg.startsWith('--') && !options.slug) options.slug = arg
  }
  return options
}

/** Runs in the page: returns advisory warnings for the currently shown step. */
function diagnose() {
  const warnings = []
  const visible = (el) => {
    const style = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.05 && rect.width > 0 && rect.height > 0
  }
  const describe = (el, text) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-chrome')
    const id = el.getAttribute('data-presentation-id') ?? (hook ? hook.name : el.tagName.toLowerCase())
    return text ? `"${text.slice(0, 30)}" <${id}>` : `<${id}>`
  }

  // Candidates: text-bearing elements (tight text rects) and chrome items without text (progress dots).
  const candidates = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim()
    const el = node.parentElement
    if (!text || !el || seen.has(el) || ['SCRIPT', 'STYLE'].includes(el.tagName) || !visible(el)) continue
    seen.add(el)
    const range = document.createRange()
    range.selectNodeContents(node)
    const rect = range.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) candidates.push({ el, rect, text })
  }
  for (const el of document.querySelectorAll('[data-presentation-chrome-item]')) {
    if (visible(el) && !seen.has(el)) candidates.push({ el, rect: el.getBoundingClientRect(), text: '' })
  }

  const exempt = (el) => el.closest('[data-presentation-allow-overlap]') !== null
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i]
      const b = candidates[j]
      if (a.el.contains(b.el) || b.el.contains(a.el) || exempt(a.el) || exempt(b.el)) continue
      const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (w > 1 && h > 1) warnings.push(`overlap: ${describe(a.el, a.text)} overlaps ${describe(b.el, b.text)}`)
    }
  }

  const props = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'opacity', 'fontWeight', 'boxShadow', 'outlineStyle', 'textDecorationLine', 'width', 'height']
  const chrome = [
    ['progress indicator', '[data-presentation-progress-item]'],
    ['table-of-contents entry', '[data-presentation-toc-item]'],
  ]
  for (const [label, selector] of chrome) {
    const items = [...document.querySelectorAll(selector)].filter(visible)
    const active = items.find((el) => el.hasAttribute('data-presentation-active'))
    const inactive = items.find((el) => !el.hasAttribute('data-presentation-active'))
    if (!active || !inactive) continue
    const a = getComputedStyle(active)
    const b = getComputedStyle(inactive)
    if (props.every((p) => a[p] === b[p])) {
      warnings.push(`indistinct active chrome: the active ${label} looks the same as inactive ones; style [data-presentation-active]`)
    }
  }

  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    warnings.push('attribution: no [data-presentation-attribution] link found; keep the default attribution and style that hook')
  } else {
    const a = getComputedStyle(attribution)
    const body = getComputedStyle(document.body)
    const size = parseFloat(a.fontSize)
    const browserDefault = a.color === 'rgb(0, 0, 238)' && a.textDecorationLine.includes('underline')
    const bodyLook = a.fontFamily === body.fontFamily && a.fontSize === body.fontSize
    if (size < 11 || browserDefault || bodyLook) {
      warnings.push(
        `attribution: the link looks too small or browser-default (${a.fontSize}, ${a.color}); style the [data-presentation-attribution] hook`,
      )
    }
  }
  return warnings
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options.slug) {
    console.error('usage: npm run inspect -- <slug> [--narrow] [--settle <ms>] [--out <dir>] [--no-build]')
    process.exit(2)
  }
  if (options.build) {
    const { code, output } = await runCommand('npm', ['run', 'build'], root)
    if (code !== 0) {
      console.error(output)
      process.exit(1)
    }
  }
  const outDir = path.resolve(root, options.out ?? path.join('inspection-output', options.narrow ? `${options.slug}-narrow` : options.slug))
  await mkdir(outDir, { recursive: true })

  const preview = await startPreview(root)
  let browser
  let warningCount = 0
  try {
    browser = await launchChromium(root)
    const page = await browser.newPage({ viewport: options.narrow ? NARROW : DESKTOP })
    await page.goto(`${preview.url}/${options.slug}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-presentation-step-count]', { timeout: 10000 })
    const count = Number(await page.getAttribute('[data-presentation-step-count]', 'data-presentation-step-count'))
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (n) => document.querySelector('[data-presentation-step-index]')?.getAttribute('data-presentation-step-index') === String(n),
          i,
        )
      }
      await page.waitForTimeout(options.settle)
      const file = path.join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      for (const warning of await page.evaluate(diagnose)) {
        warningCount++
        console.log(`WARN step ${i + 1} ${warning}`)
      }
    }
    console.log(`captured ${count} screenshots in ${path.relative(root, outDir)} (${warningCount} advisory warnings)`)
  } finally {
    await browser?.close()
    preview.stop()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
