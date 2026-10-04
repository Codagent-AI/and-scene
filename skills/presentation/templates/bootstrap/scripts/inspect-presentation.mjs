import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 4173)
const baseUrl = `http://${host}:${port}`
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
let previewExited = false
try {
  try {
    await fetch(baseUrl, { signal: AbortSignal.timeout(150) })
    throw new Error(`Port ${port} is already serving content at ${baseUrl}`)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Port ')) throw error
  }
  preview.once('error', () => { previewExited = true })
  preview.once('exit', () => { previewExited = true })
  await delay(150)
  if (previewExited) throw new Error(`Preview process exited before becoming ready at ${baseUrl}`)
  let ready = false
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (previewExited) throw new Error(`Preview process exited before becoming ready at ${baseUrl}`)
    try { if ((await fetch(baseUrl)).ok && !previewExited) { ready = true; break } } catch {}
    await delay(200)
  }
  if (!ready) throw new Error(`Preview did not become ready at ${baseUrl}; run npm run build first`)
  await mkdir('inspection', { recursive: true })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor()
  const count = Number.parseInt((await root.getAttribute('data-step-count')) ?? '', 10)
  if (!Number.isInteger(count) || count < 1) throw new Error(`Invalid data-step-count for presentation ${slug}`)
  for (let index = 0; index < count; index += 1) {
    const actual = Number.parseInt((await root.getAttribute('data-step-index')) ?? '', 10)
    if (actual !== index) throw new Error(`Expected step ${index}, observed ${actual} for presentation ${slug}`)
    await page.waitForTimeout(900)
    await page.screenshot({ path: `inspection/${slug}-${String(index + 1).padStart(2, '0')}.png` })
    const warnings = await page.evaluate(() => {
      const result = []
      const activeChrome = [...document.querySelectorAll('[data-presentation-progress-item][data-active="true"], [data-presentation-toc-item][data-active="true"]')]
      for (const active of activeChrome) {
        const selector = active.matches('[data-presentation-progress-item]') ? '[data-presentation-progress-item][data-active="false"]' : '[data-presentation-toc-item][data-active="false"]'
        const inactive = document.querySelector(selector)
        if (!inactive) continue
        const style = (item) => getComputedStyle(item)
        const keys = ['color', 'backgroundColor', 'opacity', 'borderColor', 'fontWeight', 'textDecorationLine']
        if (keys.every((key) => style(active)[key] === style(inactive)[key])) result.push('active progress or table-of-contents state may be indistinct')
      }
      const stageTexts = []
      const chromeTexts = []
      const walker = document.createTreeWalker(document.querySelector('[data-presentation]'), NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const text = walker.currentNode
        if (!text.textContent.trim()) continue
        const element = text.parentElement
        if (!element || element.closest('[data-presentation-allow-overlap]')) continue
        const range = document.createRange()
        range.selectNodeContents(text)
        const rect = range.getBoundingClientRect()
        if (!rect.width || !rect.height || getComputedStyle(element).visibility === 'hidden' || getComputedStyle(element).display === 'none') continue
        if (element.closest('[data-presentation-stage]')) stageTexts.push(rect)
        else if (element.closest('[data-presentation-header], [data-presentation-footer], [data-presentation-toc], [data-presentation-mode-toggle]')) chromeTexts.push(rect)
      }
      if (stageTexts.some((scene) => chromeTexts.some((chrome) => scene.left < chrome.right && scene.right > chrome.left && scene.top < chrome.bottom && scene.bottom > chrome.top))) result.push('visible scene text overlaps presentation chrome; mark only readable intentional overlaps with data-presentation-allow-overlap')
      const credit = document.querySelector('[data-presentation-attribution]')
      if (!credit || !credit.textContent.trim()) result.push('missing attribution')
      else {
        const creditStyle = getComputedStyle(credit.querySelector('a') ?? credit)
        if (credit.getBoundingClientRect().width < 100 || parseFloat(creditStyle.fontSize) < 12) result.push('attribution may be undersized')
        if (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(creditStyle.color)) result.push('attribution may use browser-default link styling')
      }
      return result
    })
    for (const warning of warnings) console.warn(`WARN step ${index + 1}: ${warning}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  console.log(`Captured ${count} settled steps in inspection/`)
} finally {
  await browser?.close()
  if (!previewExited && preview.exitCode === null && preview.signalCode === null) await new Promise((resolve) => { preview.once('close', resolve); preview.kill('SIGTERM') })
}
