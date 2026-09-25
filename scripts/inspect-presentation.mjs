import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'
import { inspectVisualComposition } from './visual-diagnostics.mjs'

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: npm run inspect -- <presentation-slug>')
  process.exit(2)
}
const output = resolve('inspection', slug)
const base = 'http://127.0.0.1:4173'

let previewServer
let browser
try {
  await mkdir(output, { recursive: true })
  previewServer = await startPreview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const hook = page.locator('[data-step-count]')
  await hook.waitFor()
  const count = Number(await hook.getAttribute('data-step-count'))
  if (!count) throw new Error(`Presentation ${slug} exposes no steps`)
  const warnings = []
  for (let index = 0; index < count; index += 1) {
    await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index, { timeout: 3000 })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    const diagnostics = await page.evaluate(inspectVisualComposition)
    for (const message of diagnostics.overlaps) warnings.push(`step ${index + 1}: unmarked visible text/chrome overlap: ${message}`)
    for (const control of diagnostics.indistinct) warnings.push(`step ${index + 1}: active navigation state may be visually indistinct: ${control}`)
    if (!diagnostics.polishedAttribution) warnings.push(`step ${index + 1}: attribution is missing, browser-default styled, or undersized; style [data-presentation-attribution]`)
    if (index + 1 < count) await page.keyboard.press('ArrowRight')
  }
  await writeFile(resolve(output, 'warnings.txt'), `${warnings.length ? warnings.join('\n') : 'No advisory warnings.'}\n`)
  for (const warning of warnings) console.warn(`WARNING: ${warning}`)
  console.log(`Captured ${count} settled step screenshots in ${output}`)
} catch (error) {
  console.error(`INSPECT FAILED: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  try {
    await browser?.close()
  } finally {
    if (previewServer) await new Promise((resolve, reject) => previewServer.httpServer.close((error) => error ? reject(error) : resolve()))
  }
}
