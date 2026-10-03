import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 4179)
const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  const url = `http://${host}:${port}/${encodeURIComponent(slug)}`
  let ready = false
  for (let i = 0; i < 80; i += 1) { try { if ((await fetch(url)).ok) { ready = true; break } } catch {} await delay(250) }
  if (!ready) throw new Error(`preview did not become ready at ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator('[data-step-count]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  const out = `artifacts/inspection/${slug}`
  await mkdir(out, { recursive: true })
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${out}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const result = []
      const canvas = document.querySelector('[data-presentation-canvas]')
      const footer = document.querySelector('[data-presentation-footer]')
      const toc = document.querySelector('[data-presentation-toc]')
      if (canvas && footer) {
        const cr = canvas.getBoundingClientRect(), fr = footer.getBoundingClientRect()
        for (const node of canvas.querySelectorAll('[data-presentation-node]')) {
          if (node.closest('[data-presentation-allow-overlap]')) continue
          const r = node.getBoundingClientRect()
          if (r.width && r.height && r.bottom > fr.top && r.top < fr.bottom && node.textContent?.trim()) result.push('scene text overlaps footer chrome')
        }
      }
      const active = document.querySelector('[data-presentation-progress][data-presentation-active="true"]')
      const inactive = document.querySelector('[data-presentation-progress]:not([data-presentation-active])')
      if (active && inactive) {
        const a = getComputedStyle(active), b = getComputedStyle(inactive)
        if (a.color === b.color && a.backgroundColor === b.backgroundColor && a.borderColor === b.borderColor) result.push('active progress state is visually indistinct')
      }
      if (toc) {
        const activeToc = toc.querySelector('[data-presentation-active="true"]')
        const inactiveToc = toc.querySelector('[data-presentation-toc-entry]:not([data-presentation-active])')
        if (activeToc && inactiveToc) { const a = getComputedStyle(activeToc), b = getComputedStyle(inactiveToc); if (a.color === b.color && a.backgroundColor === b.backgroundColor && a.fontWeight === b.fontWeight) result.push('active table-of-contents state is visually indistinct') }
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) result.push('attribution is missing')
      else { const s = getComputedStyle(attribution); if (Number.parseFloat(s.fontSize) < 12 || s.color === 'rgb(0, 0, 238)' || s.textDecorationLine.includes('underline')) result.push('attribution appears browser-default or undersized') }
      return result
    })
    for (const warning of warnings) console.warn(`WARNING step ${index + 1}: ${warning}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(expected => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  console.log(`Captured ${count} settled screenshots in ${out}`)
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally { await browser?.close(); preview.kill('SIGTERM') }
