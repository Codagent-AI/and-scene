import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'ignore' })
let browser
const stop = (child) => new Promise((resolve) => {
  if (child.exitCode !== null) return resolve()
  child.once('close', resolve)
  child.kill('SIGTERM')
})
try {
  const base = 'http://127.0.0.1:4174'
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { ready = (await fetch(base)).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('preview did not become ready at 127.0.0.1:4174')
  const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const bundledChromium = existsSync('/ms-playwright') ? readdirSync('/ms-playwright').filter((name) => name.startsWith('chromium-')).map((name) => `/ms-playwright/${name}/chrome-linux64/chrome`).find(existsSync) : undefined
  browser = await chromium.launch({ headless: true, ...((systemChromium || bundledChromium) ? { executablePath: systemChromium || bundledChromium } : {}) })
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  await page.goto(`${base}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  await mkdir('artifacts/inspection', { recursive: true })
  const root = page.locator('[data-presentation-root]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (!count) throw new Error(`route ${slug} did not expose presentation step hooks`)
  for (let i = 0; i < count; i++) {
    if (i) await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(900)
    const actual = Number(await root.getAttribute('data-step-index'))
    if (actual !== i) throw new Error(`step ${i + 1}: expected index ${i}, got ${actual}`)
    await page.screenshot({ path: `artifacts/inspection/${slug}-${String(i + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const visible = (element) => { const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' }
      const text = [...document.querySelectorAll('[data-presentation-scene] *, [data-presentation-header], [data-presentation-footer]')].filter((el) => visible(el) && el.children.length === 0 && el.textContent?.trim())
      const hits = []
      for (let a = 0; a < text.length; a++) for (let b = a + 1; b < text.length; b++) {
        if (text[a].closest('[data-allow-overlap]') || text[b].closest('[data-allow-overlap]')) continue
        const x = text[a].getBoundingClientRect(), y = text[b].getBoundingClientRect()
        if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) hits.push(`text overlap: “${text[a].textContent.trim()}” / “${text[b].textContent.trim()}”`)
      }
      for (const selector of ['[data-presentation-progress-item][data-presentation-active="true"]', '[data-presentation-toc-item][data-presentation-active="true"]']) {
        const active = document.querySelector(selector)
        if (active) {
          const style = getComputedStyle(active)
          if (style.color === getComputedStyle(active.parentElement).color && style.backgroundColor === 'rgba(0, 0, 0, 0)') hits.push(`active chrome may be indistinct: ${selector}`)
        }
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) hits.push('missing attribution; style [data-presentation-attribution]')
      else {
        const style = getComputedStyle(attribution)
        if (parseFloat(style.fontSize) < 11 || style.textDecorationLine === 'underline') hits.push('attribution may be browser-default or undersized; style [data-presentation-attribution]')
      }
      return hits
    })
    for (const warning of warnings) console.warn(`WARN step ${i + 1}: ${warning}`)
  }
  console.log(`Captured ${count} settled steps in artifacts/inspection/`)
} finally {
  await browser?.close()
  await stop(server)
}
