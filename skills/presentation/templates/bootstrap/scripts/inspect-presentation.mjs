import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const root = fileURLToPath(new URL('../', import.meta.url))
const artifacts = resolve(root, 'artifacts/presentations', slug)
await mkdir(artifacts, { recursive: true })
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4180', '--strictPort'], { cwd: root, stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { ready = (await fetch('http://127.0.0.1:4180')).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('preview did not become ready at 127.0.0.1:4180')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://127.0.0.1:4180/${slug}`, { waitUntil: 'networkidle' })
  const total = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!total) throw new Error(`No presentation found at /${slug}`)
  for (let step = 0; step < total; step++) {
    if (step) await page.keyboard.press('ArrowRight')
    await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, step)
    await page.waitForTimeout(900)
    await page.screenshot({ path: resolve(artifacts, `step-${String(step + 1).padStart(2, '0')}.png`), fullPage: true })
    const warnings = await page.evaluate(() => {
      const overlaps = []
      const visible = [...document.querySelectorAll('main [data-presentation-label], main [data-presentation-box], main [data-presentation-arrow], main [data-presentation-frame], main [data-presentation-emphasis], main [data-presentation-symbol-chip], main [data-presentation-header], main [data-presentation-footer]')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.height && getComputedStyle(el).visibility !== 'hidden' })
      for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i], b = visible[j]
        if (a.contains(b) || b.contains(a) || a.closest('[data-presentation-allow-overlap]') || b.closest('[data-presentation-allow-overlap]')) continue
        const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
        if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top && (a.textContent?.trim() || b.textContent?.trim())) overlaps.push(`${a.tagName}.${a.className} / ${b.tagName}.${b.className}`)
      }
      const active = document.querySelector('[data-presentation-active]')
      const inactive = document.querySelector('[data-presentation-progress] button:not([data-presentation-active]), [data-presentation-toc] button:not([data-presentation-active])')
      const activeStyle = active && getComputedStyle(active), inactiveStyle = inactive && getComputedStyle(inactive)
      const indistinct = activeStyle && inactiveStyle && ['color', 'backgroundColor', 'borderColor', 'opacity', 'fontWeight'].every((key) => activeStyle[key] === inactiveStyle[key])
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attrStyle = attribution && getComputedStyle(attribution)
      const attrWarning = !attribution || (attribution && (!attrStyle || attrStyle.fontSize === '16px' || parseFloat(attrStyle.fontSize) < 10 || attrStyle.textDecorationLine.includes('underline') || ['rgb(0, 0, 238)', 'rgb(0, 0, 255)'].includes(attrStyle.color)))
      return { overlaps, indistinct, attrWarning }
    })
    for (const collision of warnings.overlaps) console.warn(`WARN step ${step + 1}: possible overlap ${collision}`)
    if (warnings.indistinct) console.warn(`WARN step ${step + 1}: active progress/TOC state may be indistinct`)
    if (warnings.attrWarning) console.warn(`WARN step ${step + 1}: style [data-presentation-attribution] to make attribution legible and non-default`)
  }
  console.log(`Captured ${total} settled steps in ${artifacts}`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
