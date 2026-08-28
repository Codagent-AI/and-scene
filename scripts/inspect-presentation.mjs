import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { assertPresentationSlug, inspectStep } from './inspection-diagnostics.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const slug = assertPresentationSlug(process.argv[2] || 'how-to-make-a-presentation')
const port = 4174
const url = `http://127.0.0.1:${port}/${slug}`
const output = new URL(`../artifacts/presentation/${slug}/`, import.meta.url)
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))

async function waitForPreview(preview) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`preview exited before becoming ready (exit ${preview.exitCode})`)
    try { if ((await fetch(url)).ok) return } catch { /* preview is still starting */ }
    await delay(150)
  }
  throw new Error(`preview did not become ready at ${url}`)
}

async function readDiagnostics(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && box.width > 0 && box.height > 0
    }
    const elements = [...document.querySelectorAll('[data-presentation-caption], [data-presentation-controls] button, [data-presentation-progress] button, [data-presentation-toc] button, [data-presentation-attribution], [data-presentation-label]')]
      .filter(visible)
      .map((element, index) => {
        const box = element.getBoundingClientRect()
        const overlapRegion = element.closest('[data-presentation-allow-overlap="true"]')
        return {
          id: element.getAttribute('aria-label') || element.textContent?.trim() || `element-${index + 1}`,
          overlapRegion: overlapRegion ? `region-${[...document.querySelectorAll('[data-presentation-allow-overlap="true"]')].indexOf(overlapRegion)}` : null,
          rect: { bottom: box.bottom, left: box.left, right: box.right, top: box.top },
        }
      })
    const chrome = [...document.querySelectorAll('[data-presentation-progress-active], [data-presentation-toc-active]')].filter(visible)
    const signature = (target) => target ? ['backgroundColor', 'borderColor', 'color', 'fontWeight', 'opacity'].map((property) => getComputedStyle(target)[property]).join('|') : ''
    const activeStyles = chrome.map((element) => ({ active: signature(element), inactive: signature(element.parentElement?.querySelector(':scope > button:not([aria-current="step"])')) })).filter(({ inactive }) => Boolean(inactive))
    const attribution = document.querySelector('[data-presentation-attribution]')
    const attributionStyle = attribution ? getComputedStyle(attribution) : null
    return { activeStyles, attribution: { browserDefault: attributionStyle?.color === 'rgb(0, 0, 238)', fontSize: Number.parseFloat(attributionStyle?.fontSize || '0'), present: Boolean(attribution) }, elements }
  })
}

const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
let browser
try {
  await mkdir(output, { recursive: true })
  await waitForPreview(preview)
  const { chromium } = await import('playwright')
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  const deck = page.locator('[data-presentation="true"]')
  const count = Number(await deck.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`invalid step count on ${url}`)
  for (let index = 0; index < count; index += 1) {
    if (index) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => document.querySelector('[data-presentation="true"]')?.getAttribute('data-step-index') === String(expected), index)
    }
    await delay(750)
    await page.screenshot({ path: fileURLToPath(new URL(`step-${String(index + 1).padStart(2, '0')}.png`, output)), fullPage: true })
    for (const warning of inspectStep(await readDiagnostics(page))) console.warn(`warning: step ${index + 1}: ${warning}`)
  }
  console.log(`captured ${count} settled screenshots in ${fileURLToPath(output)}`)
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
