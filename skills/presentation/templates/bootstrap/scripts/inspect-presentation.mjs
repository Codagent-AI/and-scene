import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const host = '127.0.0.1'
const port = Number(process.env.PORT || 4173)
const route = process.argv[2] || process.env.PRESENTATION_ROUTE || '/'
const output = resolve(root, process.env.SCREENSHOT_DIR || 'artifacts/presentation-inspection')
const origin = `http://${host}:${port}`
const preview = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: 'inherit' })
let browser
try {
  let ready = false
  for (let i = 0; i < 80; i++) {
    if (preview.exitCode !== null) throw new Error('vite preview exited before becoming ready')
    try { if ((await fetch(origin)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${origin}`)
  await mkdir(output, { recursive: true })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count')) || 1
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(Number(process.env.INSPECT_SETTLE_MS || 700))
    const actual = Number(await page.locator('[data-step-index]').first().getAttribute('data-step-index')) || 0
    if (actual !== index) throw new Error(`expected step ${index}, found ${actual}`)
    const path = `${output}/step-${String(index + 1).padStart(2, '0')}.png`
    await page.screenshot({ path, fullPage: true })
    const warnings = await page.evaluate(() => {
      const messages = []
      const allowed = (element) => element.closest('[data-presentation-allow-overlap]')
      const textNodes = [...document.querySelectorAll('body *')].filter((el) => el.children.length === 0 && el.textContent?.trim() && el.getClientRects().length && !allowed(el))
      const chrome = [...document.querySelectorAll('[data-presentation-chrome], [data-presentation-caption], [data-presentation-navigation]')]
      for (const text of textNodes) for (const item of chrome) {
        if (text === item || text.contains(item) || item.contains(text)) continue
        const a = text.getBoundingClientRect(), b = item.getBoundingClientRect()
        if (a.width && a.height && b.width && b.height && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) { messages.push('possible text/chrome overlap'); break }
      }
      const active = [...document.querySelectorAll('[aria-current="step"], [data-presentation-active="true"]')]
      if (active.some((el) => { const style = getComputedStyle(el); return style.color === getComputedStyle(el.parentElement).color && style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.textDecorationLine === 'none' })) messages.push('active navigation may be visually indistinct')
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) messages.push('missing presentation attribution')
      else { const style = getComputedStyle(attribution); if (style.fontSize === '16px' && style.color === 'rgb(0, 0, 0)' && attribution.tagName === 'A' && !style.textDecorationLine.includes('underline')) messages.push('attribution may use browser-default styling'); if (parseFloat(style.fontSize) < 10) messages.push('attribution is undersized') }
      return messages
    })
    for (const warning of warnings) console.warn(`Advisory step ${index}: ${warning}`)
    if (errors.length) throw new Error(`browser error on step ${index}: ${errors.join('; ')}`)
    if (index + 1 < count) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  console.log(`Captured ${count} settled step screenshots in ${output}`)
} catch (error) {
  console.error(`INSPECTION FAILED: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview.exitCode === null) { preview.kill('SIGTERM'); await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)]) }
}
