import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const output = resolve('inspection', slug)
const base = 'http://127.0.0.1:4173'
let previewServer
let browser
try {
  await mkdir(output, { recursive: true })
  previewServer = await startPreview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${base}/${slug}`)
  await page.locator('[data-step-count]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  const warnings = []
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(1200)
    await page.screenshot({ path: resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    const diagnostics = await page.evaluate(() => {
      const overlap = []
      const visibleTextLeaves = (root) => [...root.querySelectorAll('*')].filter((el) => {
        const style = getComputedStyle(el)
        return el.childElementCount === 0 && style.visibility !== 'hidden' && style.display !== 'none' && el.textContent?.trim()
      })
      const scene = document.querySelector('[data-presentation-scene]')
      const sceneText = scene ? visibleTextLeaves(scene) : []
      const chrome = [...document.querySelectorAll('[data-presentation-header], [data-presentation-footer], [data-presentation-toc]')]
      const chromeText = chrome.flatMap(visibleTextLeaves)
      for (const content of sceneText) for (const chromeItem of chromeText) {
        const a = content.getBoundingClientRect(), b = chromeItem.getBoundingClientRect()
        if (a.width && a.height && b.width && b.height && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top && !content.closest('[data-presentation-allow-overlap]') && !chromeItem.closest('[data-presentation-allow-overlap]')) overlap.push('visible scene text overlaps presentation chrome')
      }
      const active = document.querySelector('[data-presentation-progress] [data-presentation-active="true"], [data-presentation-toc] [data-presentation-active="true"]')
      const inactive = active?.parentElement?.querySelector('[data-presentation-active="false"]')
      const attribution = document.querySelector('[data-presentation-attribution]')
      const activeStyle = active ? getComputedStyle(active) : null
      const inactiveStyle = inactive ? getComputedStyle(inactive) : null
      const attributionStyle = attribution ? getComputedStyle(attribution) : null
      const activeDistinct = !!active && !!activeStyle && (activeStyle.fontWeight === 'bold' || Number(activeStyle.fontWeight) >= 600 || activeStyle.textDecorationLine !== 'none' || activeStyle.outlineStyle !== 'none' || (inactiveStyle && (activeStyle.color !== inactiveStyle.color || activeStyle.backgroundColor !== inactiveStyle.backgroundColor || activeStyle.opacity !== inactiveStyle.opacity)))
      const browserDefaultLink = attribution instanceof HTMLAnchorElement && (attributionStyle?.color === 'rgb(0, 0, 238)' || attributionStyle?.textDecorationLine.includes('underline'))
      const polishedAttribution = !!attribution && !!attributionStyle && Number.parseFloat(attributionStyle.fontSize) >= 12 && !/Times New Roman/i.test(attributionStyle.fontFamily) && !browserDefaultLink
      return { overlap: [...new Set(overlap)], activeDistinct, polishedAttribution }
    })
    for (const message of diagnostics.overlap) warnings.push(`step ${index + 1}: ${message}`)
    if (!diagnostics.activeDistinct) warnings.push(`step ${index + 1}: active navigation state may be visually indistinct`)
    if (!diagnostics.polishedAttribution) warnings.push(`step ${index + 1}: attribution is missing, browser-default styled, or undersized`)
    if (index + 1 < count) await page.keyboard.press('ArrowRight')
  }
  await writeFile(resolve(output, 'warnings.txt'), `${warnings.length ? warnings.join('\n') : 'No advisory warnings.'}\n`)
  for (const warning of warnings) console.warn(`WARNING: ${warning}`)
  console.log(`Captured ${count} settled step screenshots in ${output}`)
} finally {
  try {
    await browser?.close()
  } finally {
    if (previewServer) await new Promise((resolve, reject) => previewServer.httpServer.close((error) => error ? reject(error) : resolve()))
  }
}
