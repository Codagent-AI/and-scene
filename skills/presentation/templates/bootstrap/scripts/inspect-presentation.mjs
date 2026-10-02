import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { registeredSlugs, startPreview } from './preview-utils.mjs'
const entries = await registeredSlugs(new URL('../src/presentations/index.ts', import.meta.url))

const slug = process.argv[2]
if (!entries.includes(slug)) { console.error(`Unknown presentation: ${slug || '(missing slug)'}`); process.exit(1) }
let browser
let previewServer
try {
  previewServer = await startPreview()
  const { host, port } = previewServer
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://${host}:${port}/${slug}`)
  await page.locator('[data-presentation]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  const out = `presentation-artifacts/${slug}`
  await mkdir(out, { recursive: true })
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(900)
    const warnings = await page.evaluate(() => {
      const result = []
      const texts = [...document.querySelectorAll('[data-presentation] :is(h1,h2,h3,p,a,button,[data-presentation-caption],[data-presentation-live-title],[data-presentation-node])')].filter((el) => el.getClientRects().length)
      const rect = (el) => el.getBoundingClientRect()
      const label = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().replaceAll(' ', '.')}` : ''} (${(el.textContent || '').trim().replaceAll('\\n', ' ').slice(0, 36)})`
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
        if (texts[i].contains(texts[j]) || texts[j].contains(texts[i]) || texts[i].closest('[data-allow-overlap]') || texts[j].closest('[data-allow-overlap]')) continue
        const a = rect(texts[i]), b = rect(texts[j])
        if (a.width && a.height && b.width && b.height && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) result.push(`possible visible text/chrome overlap: ${label(texts[i])} ↔ ${label(texts[j])}`)
      }
      const active = [...document.querySelectorAll('[data-presentation-active="true"]')]
      for (const el of active) {
        const css = getComputedStyle(el), inactive = el.parentElement?.querySelector('[data-presentation-active="false"]')
        if (inactive && css.color === getComputedStyle(inactive).color && css.backgroundColor === getComputedStyle(inactive).backgroundColor && css.fontWeight === getComputedStyle(inactive).fontWeight) result.push('active navigation may look like inactive controls')
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) result.push('missing attribution')
      else { const link = attribution.querySelector('a'), css = getComputedStyle(link || attribution); if (!link || Number.parseFloat(css.fontSize) < 11 || css.textDecorationLine === 'underline') result.push('attribution may be browser-default or too small') }
      return [...new Set(result)]
    })
    for (const warning of warnings) console.warn(`WARN step ${index + 1}: ${warning}`)
    await page.screenshot({ path: `${out}/step-${String(index + 1).padStart(2, '0')}.png` })
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`Captured ${count} settled step screenshots in ${out}`)
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally { await browser?.close(); await previewServer?.close() }
