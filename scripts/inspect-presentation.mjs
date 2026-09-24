import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { collectVisualDiagnostics } from './inspection-diagnostics.mjs'
import { preview } from 'vite'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const settleMs = Number(process.env.PRESENTATION_SETTLE_MS ?? 1400)
if (!Number.isFinite(settleMs) || settleMs < 0) throw new Error('PRESENTATION_SETTLE_MS must be a non-negative number')
const outputDir = `artifacts/inspection/${slug}`
await mkdir(outputDir, { recursive: true })
const server = await preview({ preview: { host: '127.0.0.1', port: 0 } })
let browser
try {
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') throw new Error('Preview server did not expose a TCP address')
  const baseUrl = `http://127.0.0.1:${address.port}`
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseUrl}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`Route ${slug} did not expose a valid step count`)
  for (let index = 0; index < count; index++) {
    if (index > 0) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, index)
    }
    await page.waitForTimeout(settleMs)
    const path = `${outputDir}/step-${String(index + 1).padStart(2, '0')}.png`
    await page.screenshot({ path, fullPage: true })
    const diagnostics = await page.evaluate(collectVisualDiagnostics)
    for (const overlap of diagnostics.overlaps) console.warn(`Visual warning, step ${index + 1}: ${overlap}`)
    if (diagnostics.weakProgress) console.warn(`Visual warning, step ${index + 1}: active progress state may not be visually distinct`)
    if (diagnostics.weakToc) console.warn(`Visual warning, step ${index + 1}: active table-of-contents state may not be visually distinct`)
    if (diagnostics.weakAttribution) console.warn(`Visual warning, step ${index + 1}: attribution is missing or may be browser-default/undersized; style [data-presentation-attribution]`)
  }
  console.log(`Captured ${count} settled steps in ${outputDir}. Review screenshots for scene composition.`)
} finally {
  await browser?.close()
  server.httpServer.closeAllConnections()
  await new Promise((resolve) => server.httpServer.close(resolve))
}
