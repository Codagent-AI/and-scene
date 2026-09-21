import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { startPreview, stopPreview } from './preview-server.mjs'
import { collectVisualDiagnostics } from './visual-diagnostics.mjs'

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
      const warnings = await page.evaluate(collectVisualDiagnostics)
      for (const warning of warnings) console.warn(`ADVISORY step ${index + 1}: ${warning}`)
      await page.screenshot({ path: `${outputDir}/${slug}-step-${index + 1}.png`, fullPage: true })
    }
    console.log(`PASS: captured ${count} settled screenshots in ${outputDir}`)
  } finally { await browser.close() }
} finally { await stopPreview(preview) }
