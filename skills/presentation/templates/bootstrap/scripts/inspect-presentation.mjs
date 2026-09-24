import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const port = Number(process.env.AND_SCENE_INSPECT_PORT ?? 4179)
const settleInterval = Number(process.env.PRESENTATION_INSPECT_SETTLE_MS ?? 900)
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let i = 0; i < 60; i++) { try { ready = (await fetch(`http://127.0.0.1:${port}/`)).ok; if (ready) break } catch {} await delay(250) }
  if (!ready) throw new Error(`vite preview did not start at 127.0.0.1:${port}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`http://127.0.0.1:${port}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
  if (!count) throw new Error(`No presentation steps found at /${slug}`)
  await mkdir('artifacts/inspection', { recursive: true })
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(settleInterval)
    await page.screenshot({ path: `artifacts/inspection/${slug}-${String(index + 1).padStart(2, '0')}.png` })
    const diagnostics = await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      }
      const textItems = [...document.querySelectorAll('main [data-presentation-scene] *, main [data-presentation-footer] *, main [data-presentation-header] *')]
        .filter((element) => element.children.length === 0 && element.textContent.trim() && visible(element))
        .filter((element) => !element.closest('[data-presentation-allow-overlap]'))
        .map((element) => ({
          text: element.textContent.trim().replace(/\s+/g, ' ').slice(0, 50),
          rect: element.getBoundingClientRect().toJSON(),
        }))
      const overlaps = []
      for (let a = 0; a < textItems.length; a++) for (let b = a + 1; b < textItems.length; b++) {
        const left = textItems[a].rect, right = textItems[b].rect
        const width = Math.min(left.right, right.right) - Math.max(left.left, right.left)
        const height = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top)
        if (width > 2 && height > 2) overlaps.push(`${textItems[a].text} / ${textItems[b].text}`)
      }
      const distinct = (selector) => {
        const active = document.querySelector(`${selector}[aria-current="step"]`)
        if (!active) return { present: Boolean(document.querySelector(selector)), distinct: false }
        const inactive = document.querySelector(`${selector}:not([aria-current="step"])`)
        if (!inactive) return { present: true, distinct: true }
        const activeStyle = getComputedStyle(active)
        const inactiveStyle = getComputedStyle(inactive)
        return { present: true, distinct: active.getAttribute('data-presentation-active') === 'true' && (
          activeStyle.color !== inactiveStyle.color || activeStyle.backgroundColor !== inactiveStyle.backgroundColor ||
          activeStyle.borderColor !== inactiveStyle.borderColor || activeStyle.outlineStyle !== 'none' || activeStyle.fontWeight !== inactiveStyle.fontWeight
        ) }
      }
      const progress = distinct('[data-presentation-progress-item]')
      const toc = distinct('[data-presentation-toc-item]')
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attributionStyle = attribution && getComputedStyle(attribution)
      return {
        overlaps,
        progress,
        toc,
        attributionPresent: Boolean(attribution),
        attributionStyled: Boolean(attribution && Number.parseFloat(attributionStyle.fontSize) >= 12 && attributionStyle.textDecorationLine !== 'underline'),
      }
    })
    for (const overlap of diagnostics.overlaps) console.warn(`WARN step ${index + 1}: overlapping visible text: ${overlap}`)
    if (!diagnostics.progress.present || !diagnostics.progress.distinct) console.warn(`WARN step ${index + 1}: active progress state is missing or visually indistinct`)
    if (diagnostics.toc.present && !diagnostics.toc.distinct) console.warn(`WARN step ${index + 1}: active table-of-contents state is missing or visually indistinct`)
    if (!diagnostics.attributionPresent || !diagnostics.attributionStyled) console.warn(`WARN step ${index + 1}: attribution is missing, browser-default, or undersized`)
    if (index + 1 < count) await page.getByRole('button', { name: 'Next step' }).click()
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(`Captured ${count} settled step screenshots in artifacts/inspection`)
} finally {
  await browser?.close()
  child.kill('SIGTERM')
}
