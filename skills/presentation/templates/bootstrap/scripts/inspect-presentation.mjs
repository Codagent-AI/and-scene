import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { registeredSlugs, startPreview } from './preview-utils.mjs'
import { inspectDiagnostics } from './inspect-diagnostics.mjs'
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
  if (!Number.isInteger(count) || count < 1) throw new Error(`invalid data-step-count on ${slug}`)
  const out = `presentation-artifacts/${slug}`
  await mkdir(out, { recursive: true })
  for (let index = 0; index < count; index++) {
    await page.waitForFunction((expected) => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(expected), index, { timeout: 5_000 })
    await page.waitForTimeout(Number(process.env.PRESENTATION_SETTLE_MS ?? 1100))
    const warnings = await page.evaluate(inspectDiagnostics)
    for (const warning of warnings) console.warn(`WARN step ${index + 1}: ${warning}`)
    await page.screenshot({ path: `${out}/step-${String(index + 1).padStart(2, '0')}.png` })
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`Captured ${count} settled step screenshots in ${out}`)
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally {
  try { await browser?.close() } catch (error) { console.warn(`Browser cleanup failed: ${error.message}`) }
  try { await previewServer?.close() } catch (error) { console.warn(`Preview cleanup failed: ${error.message}`) }
}
