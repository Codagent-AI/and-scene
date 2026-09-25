import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = 4179
const server = spawn('npm', ['--prefix', project, 'run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore', shell: process.platform === 'win32' })
let browser
try {
  const url = `http://127.0.0.1:${port}`
  let ready = false
  for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) { ready = true; break } } catch {} await delay(250) }
  if (!ready) throw new Error('Preview did not become ready on 127.0.0.1')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`${url}/${encodeURIComponent(slug)}`)
  await page.locator('[data-step-count]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  const output = path.resolve('artifacts/presentation-inspection', slug)
  await mkdir(output, { recursive: true })
  for (let index = 0; index < count; index++) {
    await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index)
    await page.waitForTimeout(900)
    const warnings = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('[data-presentation-progress-item], [data-presentation-toc-item]')].filter((el) => el.getAttribute('data-presentation-active') === 'true')
      const weakActive = visible.some((el) => { const style = getComputedStyle(el); const parentStyle = el.parentElement ? getComputedStyle(el.parentElement) : style; return style.color === parentStyle.color && style.backgroundColor === parentStyle.backgroundColor && style.fontWeight === parentStyle.fontWeight && style.outlineStyle === 'none' })
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attributionStyle = attribution && getComputedStyle(attribution)
      const weakAttribution = !attribution || !attribution.querySelector('a') || !attributionStyle || parseFloat(attributionStyle.fontSize) < 12 || attributionStyle.textDecorationLine === 'underline'
      const candidates = [...document.querySelectorAll('[data-presentation-caption], [data-presentation-title], [data-presentation-node], [data-presentation-attribution], [data-presentation-progress], [data-presentation-toc]')]
      const overlap = candidates.some((a, i) => candidates.slice(i + 1).some((b) => {
        if (a.closest('[data-allow-overlap]') || b.closest('[data-allow-overlap]')) return false
        const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
        return x.width > 0 && y.width > 0 && x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top
      }))
      return { weakActive, weakAttribution, overlap }
    })
    if (warnings.overlap) console.warn(`WARN step ${index}: possible unmarked visible text/chrome overlap`)
    if (warnings.weakActive) console.warn(`WARN step ${index}: active progress or contents state may be indistinct`)
    if (warnings.weakAttribution) console.warn(`WARN step ${index}: attribution is missing, browser-default, or undersized`)
    await page.screenshot({ path: path.join(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    if (index + 1 < count) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900) }
  }
  console.log(`Captured ${count} settled step screenshots in ${output}`)
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally { await browser?.close(); server.kill('SIGTERM') }
