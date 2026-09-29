import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
let server
let browser
try {
  server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { stdio: 'ignore' })
  const url = `http://127.0.0.1:4178/${slug}`
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('Preview did not become ready; run npm run build first')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await mkdir('inspection', { recursive: true })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!count) throw new Error(`No presentation chrome found at ${url}`)
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(900)
    const warnings = await page.evaluate(() => {
      const result = []
      const visible = element => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      }
      const candidates = [...document.querySelectorAll('[data-presentation-node], [data-presentation-header] span, [data-presentation-header] strong, [data-presentation-caption], [data-presentation-attribution], [data-presentation-mode-toggle], [data-presentation-prev], [data-presentation-next], [data-presentation-toc-item]')]
        .filter(element => visible(element) && element.textContent?.trim() && !element.hasAttribute('data-presentation-allow-overlap'))
      for (let left = 0; left < candidates.length; left++) for (let right = left + 1; right < candidates.length; right++) {
        const a = candidates[left], b = candidates[right]
        if (a.contains(b) || b.contains(a) || a.closest('[data-presentation-allow-overlap]') || b.closest('[data-presentation-allow-overlap]')) continue
        const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
        const overlapWidth = Math.min(x.right, y.right) - Math.max(x.left, y.left)
        const overlapHeight = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top)
        if (overlapWidth > 3 && overlapHeight > 3) result.push(`visible text/chrome overlap: “${a.textContent.trim().slice(0, 36)}” with “${b.textContent.trim().slice(0, 36)}”; add data-presentation-allow-overlap only when intentional and readable`)
      }
      const active = document.querySelector('[data-presentation-active="true"]')
      const inactive = document.querySelector('[data-presentation-active="false"]')
      if (active && inactive) {
        const a = getComputedStyle(active), b = getComputedStyle(inactive)
        if (a.color === b.color && a.backgroundColor === b.backgroundColor && a.borderColor === b.borderColor && a.opacity === b.opacity && a.transform === b.transform) result.push('active navigation is visually indistinct from inactive navigation')
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution || !visible(attribution)) result.push('attribution is missing or hidden')
      else {
        const style = getComputedStyle(attribution)
        if (style.fontSize === '16px' && style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline')) result.push('attribution appears browser-default')
        if (parseFloat(style.fontSize) < 11) result.push('attribution text is undersized')
      }
      return [...new Set(result)]
    })
    await page.screenshot({ path: `inspection/${slug}-${String(index + 1).padStart(2, '0')}.png` })
    console.log(`Captured step ${index + 1}/${count}`)
    for (const warning of warnings) console.warn(`Advisory step ${index}: ${warning}`)
    if (index + 1 < count) {
      await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction(expected => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
      } catch { throw new Error(`Step transition failed at index ${index + 1}`) }
    }
  }
  console.log('Review the screenshots in inspection/ for scene fit, chrome collisions, active navigation, and attribution.')
} catch (error) {
  console.error(`Inspection failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await delay(100) }
}
