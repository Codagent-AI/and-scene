import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { startPreview, stopPreview } from './preview-server.mjs'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const registry = readFileSync('src/presentations/index.ts', 'utf8')
if (!registry.includes(`slug: '${slug}'`)) throw new Error(`Unknown presentation slug: ${slug}`)
const host = '127.0.0.1'; const port = 4174; const outputDir = 'artifacts/inspection'
mkdirSync(outputDir, { recursive: true })
let preview
try {
  preview = await startPreview(host, port)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`http://${host}:${port}/${slug}`, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation-scene]').waitFor({ state: 'visible' })
    const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
    for (let index = 0; index < count; index += 1) {
      if (index) { await page.locator('[data-presentation-progress] button').nth(index).click(); await page.waitForTimeout(850) }
      const warnings = await page.evaluate(() => {
        const result = []
        const active = document.querySelector('[data-presentation-progress-item="active"]')
        const inactive = document.querySelector('[data-presentation-progress] button:not([data-presentation-progress-item="active"])')
        if (active && inactive) {
          const activeStyle = getComputedStyle(active); const inactiveStyle = getComputedStyle(inactive)
          if (activeStyle.backgroundColor === inactiveStyle.backgroundColor && activeStyle.color === inactiveStyle.color && activeStyle.borderColor === inactiveStyle.borderColor) result.push('active progress may be visually indistinct')
        }
        const attribution = document.querySelector('[data-presentation-attribution]')
        if (!attribution || parseFloat(getComputedStyle(attribution).fontSize) < 11) result.push('attribution is missing or undersized; style [data-presentation-attribution]')
        const nodes = [...document.querySelectorAll('[data-presentation-label],[data-presentation-box],[data-presentation-caption],[data-presentation-title],[data-presentation-present-title]')].filter((node) => { const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 })
        for (let left = 0; left < nodes.length; left += 1) for (let right = left + 1; right < nodes.length; right += 1) {
          if (nodes[left].contains(nodes[right]) || nodes[right].contains(nodes[left]) || nodes[left].closest('[data-allow-overlap]') || nodes[right].closest('[data-allow-overlap]')) continue
          const a = nodes[left].getBoundingClientRect(); const b = nodes[right].getBoundingClientRect()
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) result.push(`unmarked overlap: ${nodes[left].textContent?.trim().slice(0, 20)} / ${nodes[right].textContent?.trim().slice(0, 20)}`)
        }
        return result
      })
      for (const warning of warnings) console.warn(`ADVISORY step ${index + 1}: ${warning}`)
      await page.screenshot({ path: `${outputDir}/${slug}-step-${index + 1}.png`, fullPage: true })
    }
    console.log(`PASS: captured ${count} settled screenshots in ${outputDir}`)
  } finally { await browser.close() }
} finally { await stopPreview(preview) }
