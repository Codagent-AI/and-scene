import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const settleMs = Number(process.env.PRESENTATION_SETTLE_MS ?? 1400)
const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 60; i++) { try { await fetch('http://127.0.0.1:4178'); break } catch { await delay(250) } }
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://127.0.0.1:4178/${slug}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(settleMs)
    await page.screenshot({ path: `presentation-${slug}-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const diagnostics = await page.evaluate(() => {
      const rect = (element) => element.getBoundingClientRect()
      const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      const textItems = [...document.querySelectorAll('[data-presentation-node]')].filter((element) => element.textContent?.trim())
      const chrome = [...document.querySelectorAll('[data-presentation-footer], [data-presentation-toc], [data-presentation-attribution]')]
      const overlaps = []
      for (const item of textItems) {
        if (item.closest('[data-presentation-allow-overlap]')) continue
        for (const itemChrome of chrome) {
          if (intersects(rect(item), rect(itemChrome))) overlaps.push(`${item.tagName.toLowerCase()} overlaps ${itemChrome.getAttribute('data-presentation-footer') !== null ? 'footer' : itemChrome.getAttribute('data-presentation-toc') !== null ? 'table of contents' : 'attribution'}`)
        }
      }
      const indistinct = (selector) => {
        const current = document.querySelector(selector)
        if (!current) return false
        const style = getComputedStyle(current)
        return style.outlineStyle === 'none' && style.fontWeight === '400' && style.backgroundColor === 'rgba(0, 0, 0, 0)'
      }
      const weakProgress = Boolean(document.querySelector('[data-presentation-progress]')) && indistinct('[data-presentation-progress-item][data-presentation-active="true"]')
      const weakToc = Boolean(document.querySelector('[data-presentation-toc]')) && indistinct('[data-presentation-toc-item][data-presentation-active="true"]')
      const attribution = document.querySelector('[data-presentation-attribution] a')
      const attributionStyle = attribution ? getComputedStyle(attribution) : null
      const weakAttribution = !attribution || Number.parseFloat(attributionStyle.fontSize) < 11 || ['rgb(0, 0, 0)', 'rgb(0, 0, 238)'].includes(attributionStyle.color)
      return { overlaps, weakProgress, weakToc, weakAttribution }
    })
    for (const overlap of diagnostics.overlaps) console.warn(`Visual warning, step ${index}: ${overlap}`)
    if (diagnostics.weakProgress) console.warn(`Visual warning, step ${index}: active progress state may not be visually distinct`)
    if (diagnostics.weakToc) console.warn(`Visual warning, step ${index}: active table-of-contents state may not be visually distinct`)
    if (diagnostics.weakAttribution) console.warn(`Visual warning, step ${index}: attribution is missing or may be browser-default/undersized`)
    if (index + 1 < count) await page.keyboard.press('ArrowRight')
  }
  console.log(`Captured ${count} settled steps. Review screenshots for scene and chrome collisions.`)
} finally { await browser?.close(); server.kill('SIGTERM') }
