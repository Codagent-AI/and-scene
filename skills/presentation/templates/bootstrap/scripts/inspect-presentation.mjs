import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = 4174
const settleMs = 700

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is still starting */ }
    await delay(100)
  }
  throw new Error(`Preview did not become ready at ${url}`)
}

if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const output = resolve('artifacts', 'presentation-inspection', slug)
await mkdir(output, { recursive: true })
const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser

try {
  const url = `http://${host}:${port}/${slug}`
  await waitForPreview(url)
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-step-count][data-step-index]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`No renderable steps found at ${url}`)
  for (let index = 0; index < count; index += 1) {
    await delay(settleMs)
    await page.screenshot({ path: resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    const warnings = await page.evaluate(() => {
      const relevant = '[data-presentation-caption], [data-presentation-header], [data-presentation-footer], [data-presentation-toc], [data-presentation-controls], [data-presentation-node], [data-presentation-attribution]'
      const visible = (element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && box.width > 0 && box.height > 0
      }
      const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      const elements = [...document.querySelectorAll(relevant)].filter(visible)
      const warnings = []
      for (let firstIndex = 0; firstIndex < elements.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < elements.length; secondIndex += 1) {
          const first = elements[firstIndex]
          const second = elements[secondIndex]
          if (first.contains(second) || second.contains(first)) continue
          if (first.closest('[data-presentation-allow-overlap]') || second.closest('[data-presentation-allow-overlap]')) continue
          if (intersects(first.getBoundingClientRect(), second.getBoundingClientRect())) warnings.push(`overlap: ${first.tagName.toLowerCase()} and ${second.tagName.toLowerCase()}`)
        }
      }
      for (const selector of ['[data-presentation-progress-item]', '[data-presentation-toc-entry]']) {
        const active = document.querySelector(`${selector}[data-presentation-active="true"]`)
        const inactive = document.querySelector(`${selector}[data-presentation-active="false"]`)
        if (active && inactive) {
          const activeStyle = getComputedStyle(active)
          const inactiveStyle = getComputedStyle(inactive)
          if (activeStyle.color === inactiveStyle.color && activeStyle.backgroundColor === inactiveStyle.backgroundColor && activeStyle.borderColor === inactiveStyle.borderColor && activeStyle.opacity === inactiveStyle.opacity) warnings.push(`indistinct active chrome: ${selector}`)
        }
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) warnings.push('missing attribution: style [data-presentation-attribution] locally')
      else {
        const style = getComputedStyle(attribution)
        if (Number.parseFloat(style.fontSize) < 12 || style.color === 'rgb(0, 0, 238)' || style.textDecorationLine.includes('underline')) warnings.push('unpolished attribution: style [data-presentation-attribution] locally')
      }
      return [...new Set(warnings)]
    })
    for (const warning of warnings) console.warn(`WARN step ${index}: ${warning}`)
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`Captured ${count} settled screenshots in ${output}`)
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
