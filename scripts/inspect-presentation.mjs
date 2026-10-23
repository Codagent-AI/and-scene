#!/usr/bin/env node
// Captures a settled screenshot per step of a registered presentation and prints advisory
// visual warnings. Usage: npm run inspect -- <slug> [--settle <ms>] [--viewport <WxH>] [--skip-build] [--positions]
// Warnings are advisory: they never change the exit code. Only capture failures exit non-zero.
import { mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { findFreePort, runBuild, startPreview } from './lib/preview.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
/** Covers the kit's longest transition: layout (0.6 s) + newcomer delay (0.7 s) + fade (0.5 s). */
const DEFAULT_SETTLE_MS = 2000
const DEFAULT_VIEWPORT = { width: 1280, height: 720 }
const OVERLAP_MIN_AREA = 16
const STABLE_SAMPLE_MS = 150
const STABLE_TIMEOUT_MS = 4000

function parseArgs(argv) {
  const options = { slug: null, settle: DEFAULT_SETTLE_MS, viewport: DEFAULT_VIEWPORT, skipBuild: false, positions: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--settle') options.settle = Number(argv[++i])
    else if (arg === '--viewport') {
      const [width, height] = argv[++i].split('x').map(Number)
      options.viewport = { width, height }
    } else if (arg === '--skip-build') options.skipBuild = true
    else if (arg === '--positions') options.positions = true
    else if (!options.slug) options.slug = arg
    else throw new Error(`unexpected argument: ${arg}`)
  }
  if (!options.slug) throw new Error('usage: inspect-presentation.mjs <slug>')
  return options
}

/** Collects per-step advisory diagnostics from the rendered DOM. */
async function diagnose(page) {
  return page.evaluate(
    ({ minArea }) => {
      const warnings = []
      const root = document.querySelector('[data-presentation-root]')
      const stepLabel = String(Number(root.getAttribute('data-step-index')) + 1)

      // Glyph bounds: a text element's box can be far larger than its text, so measure the text.
      const textBox = (el) => {
        const range = document.createRange()
        range.selectNodeContents(el)
        return range.getBoundingClientRect()
      }
      const isShown = (el) => {
        const style = getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
      }
      const ownText = (el) => [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '')
      // Exempt only when both elements sit inside the same marked subtree.
      const exemptPair = (a, b) => {
        const marked = a.closest('[data-presentation-allow-overlap]')
        return marked !== null && marked.contains(b)
      }

      // Overlap: two visible text elements whose boxes intersect, neither containing the other.
      const texts = [...root.querySelectorAll('*')].filter((el) => ownText(el) && isShown(el))
      for (let i = 0; i < texts.length; i += 1) {
        for (let j = i + 1; j < texts.length; j += 1) {
          const a = texts[i]
          const b = texts[j]
          if (a.contains(b) || b.contains(a) || exemptPair(a, b) || exemptPair(b, a)) continue
          const ra = textBox(a)
          const rb = textBox(b)
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
          if (w > 0 && h > 0 && w * h >= minArea) {
            warnings.push(`step ${stepLabel}: overlap between "${a.textContent.trim().slice(0, 30)}" and "${b.textContent.trim().slice(0, 30)}"`)
          }
        }
      }

      // Active chrome: an active dot or ToC entry identical to an inactive sibling on every checked property.
      const checked = ['color', 'background-color', 'border-top-color', 'opacity', 'font-weight', 'width', 'height']
      const signature = (el) => {
        const style = getComputedStyle(el)
        return checked.map((prop) => style.getPropertyValue(prop)).join('|')
      }
      for (const selector of ['[data-presentation-progress-dot]', '[data-presentation-toc-entry]']) {
        const items = [...document.querySelectorAll(selector)]
        const active = items.find((el) => el.getAttribute('data-presentation-active') === 'true')
        if (!active) continue
        const sameAsInactive = items.some((el) => el !== active && signature(el) === signature(active))
        if (sameAsInactive) warnings.push(`step ${stepLabel}: active ${selector.replace(/\[|\]/g, '')} is indistinct from inactive items`)
      }

      // Attribution: present, not too small, and not the browser-default link look.
      const attribution = root.querySelector('[data-presentation-attribution]')
      if (!attribution || !isShown(attribution)) {
        warnings.push(`step ${stepLabel}: attribution link missing; style [data-presentation-attribution]`)
      } else {
        const style = getComputedStyle(attribution)
        const browserDefault = style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline')
        if (parseFloat(style.fontSize) < 11 || browserDefault) {
          warnings.push(`step ${stepLabel}: attribution is too small or browser-default; style [data-presentation-attribution]`)
        }
      }
      return warnings
    },
    { minArea: OVERLAP_MIN_AREA },
  )
}

/** Element geometry on the page, sampled to detect motion. */
async function geometrySnapshot(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-presentation-id]')].map((el) => {
      const r = el.getBoundingClientRect()
      return `${el.getAttribute('data-presentation-id')}=${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`
    }),
  )
}

async function positions(page) {
  return geometrySnapshot(page)
}

/** Waits until entity geometry stops changing, so captures show the completed state. */
async function waitUntilStable(page) {
  const deadline = Date.now() + STABLE_TIMEOUT_MS
  let previous = await geometrySnapshot(page)
  while (Date.now() < deadline) {
    await page.waitForTimeout(STABLE_SAMPLE_MS)
    const current = await geometrySnapshot(page)
    if (current.join('|') === previous.join('|')) return
    previous = current
  }
  console.log('warning: presentation still moving after the settle timeout; capture may be mid-transition')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const outDir = join(root, '.inspection', options.slug)
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  if (!options.skipBuild) await runBuild(root, (line) => console.log(line))
  const preview = await startPreview(root, await findFreePort())
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: options.viewport })
    await page.goto(`${preview.url}/${options.slug}`)
    const rootLocator = page.locator('[data-presentation-root]')
    await rootLocator.waitFor()
    const count = Number(await rootLocator.getAttribute('data-step-count'))

    for (let index = 0; index < count; index += 1) {
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
      }
      await page.waitForFunction(
        (expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected),
        index,
      )
      await page.waitForTimeout(options.settle)
      await waitUntilStable(page)
      const file = join(outDir, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      console.log(`captured: ${file}`)
      if (options.positions) {
        for (const line of await positions(page)) console.log(`position: step ${String(index + 1).padStart(2, '0')} ${line}`)
      }
      for (const warning of await diagnose(page)) console.log(`warning: ${warning}`)
    }
    console.log(`inspect: ${count} steps captured for ${options.slug}`)
  } finally {
    await browser.close()
    await preview.stop()
  }
}

main().catch((error) => {
  console.error(`inspect: ${error.message}`)
  process.exit(1)
})
