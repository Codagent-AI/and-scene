import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { collectVisualDiagnostics } from './visual-diagnostics.mjs'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const registry = readFileSync('src/presentations/index.ts', 'utf8')
const routes = [...registry.matchAll(/slug\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
if (!routes.includes(slug)) throw new Error(`Unknown presentation slug: ${slug}`)

const host = '127.0.0.1'
const port = 4174
const outputDir = 'artifacts/inspection'
mkdirSync(outputDir, { recursive: true })
const { preview } = await import('vite')
let server
let browser
try {
  server = await preview({ preview: { host, port, strictPort: true } })
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console.error: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  await page.goto(`http://${host}:${port}/${slug}`, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation-scene]').waitFor({ state: 'visible' })
  const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
  if (!count) throw new Error(`${slug}: no step count was exposed`)
  const indices = [...new Set([0, Math.floor((count - 1) / 2), count - 1])]
  for (const index of indices) {
    await page.locator('[data-presentation-progress-item]').nth(index).click()
    await page.waitForTimeout(800)
    const actual = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-index'))
    if (actual !== index) throw new Error(`${slug}: failed to settle on step ${index + 1}`)
    // Visual composition findings are advisory inspection artifacts, not pass/fail evidence.
    const warnings = await page.evaluate(collectVisualDiagnostics)
    for (const warning of warnings) console.warn(`ADVISORY step ${index + 1}: ${warning}`)
    await page.screenshot({ path: `${outputDir}/${slug}-step-${index + 1}.png`, fullPage: true })
  }
  if (errors.length) throw new Error(errors.join('; '))
  console.log(`PASS: captured ${indices.length} settled screenshots in ${outputDir}`)
} finally {
  try { await browser?.close() } finally {
    if (server?.httpServer.listening) await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
  }
}
