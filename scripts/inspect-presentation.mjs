import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { startPreview, stopPreview } from './preview-server.mjs'

const source = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
const slugs = [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
const slug = process.argv[2]
if (!slugs.includes(slug)) { console.error(`FAIL: unknown presentation "${slug ?? ''}". Registered: ${slugs.join(', ')}`); process.exit(1) }
let preview
let browser
try {
  preview = await startPreview()
  const { base } = preview
  let ready = false
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(base)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('preview did not become ready at 127.0.0.1')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const browserErrors = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`))
  const out = `artifacts/inspect/${slug}`
  await mkdir(out, { recursive: true })
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const footer = page.locator('[data-step-count]')
  await footer.waitFor()
  const count = Number(await footer.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`invalid data-step-count: ${count}`)
  for (let index = 0; index < count; index++) {
    if (index > 0) await page.keyboard.press('ArrowRight')
    try {
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index)
    } catch (error) {
      if (browserErrors.length) throw new Error(`step ${index + 1} browser error: ${browserErrors.join('; ')}`)
      throw new Error(`step ${index + 1} did not become active: ${error.message}`)
    }
    await page.waitForTimeout(900)
    if (browserErrors.length) throw new Error(`step ${index + 1} browser error: ${browserErrors.join('; ')}`)
    await page.screenshot({ path: `${out}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const isVisible = (element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
      }
      const elements = [...document.querySelectorAll('body *')].filter((element) => element.children.length === 0 && element.textContent?.trim() && isVisible(element))
      const overlaps = []
      for (let a = 0; a < elements.length; a++) for (let b = a + 1; b < elements.length; b++) {
        if (elements[a].closest('[data-allow-overlap]') || elements[b].closest('[data-allow-overlap]')) continue
        const first = elements[a].getBoundingClientRect(), second = elements[b].getBoundingClientRect()
        if (first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top) {
          overlaps.push(`${elements[a].textContent.trim().replace(/\s+/g, ' ')} / ${elements[b].textContent.trim().replace(/\s+/g, ' ')}`)
        }
      }
      const chrome = [
        { name: 'progress', active: document.querySelector('[data-presentation-progress] [aria-current="step"]'), inactive: document.querySelector('[data-presentation-progress-item][data-presentation-active="false"]') },
        { name: 'table of contents', active: document.querySelector('[data-presentation-toc] [aria-current="location"]'), inactive: document.querySelector('[data-presentation-toc-item][data-presentation-active="false"]') },
      ]
      const indistinct = chrome.filter(({ active, inactive }) => active && inactive && ['color', 'backgroundColor', 'opacity', 'borderColor'].every((key) => getComputedStyle(active)[key] === getComputedStyle(inactive)[key])).map(({ name }) => name)
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attributionStyle = attribution && getComputedStyle(attribution)
      const attributionBad = !attribution || !attribution.getAttribute('href') || parseFloat(attributionStyle.fontSize) < 11 || attributionStyle.color === 'rgb(0, 0, 238)' || attributionStyle.textDecorationLine === 'underline'
      return { overlaps, indistinct, attributionBad }
    })
    if (warnings.overlaps.length) console.warn(`WARN step ${index + 1}: possible unmarked visible text/chrome overlap: ${warnings.overlaps.join('; ')}`)
    if (warnings.indistinct.length) console.warn(`WARN step ${index + 1}: active ${warnings.indistinct.join(' and ')} state may be indistinct`)
    if (warnings.attributionBad) console.warn(`WARN step ${index + 1}: attribution missing or unpolished; style [data-presentation-attribution]`)
  }
  console.log(`PASS: captured ${count} settled screenshots in ${out}`)
} catch (error) { console.error(`FAIL: inspect ${slug}: ${error.message}`); process.exitCode = 1 }
finally {
  await browser?.close()
  if (preview) await stopPreview(preview.server)
}
