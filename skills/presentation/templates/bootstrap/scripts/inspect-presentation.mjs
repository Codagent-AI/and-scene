import { mkdir } from 'node:fs/promises'
import { launchChromium, startPreview } from './browser.mjs'
import { collectVisualWarnings } from './visual-diagnostics.mjs'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
let server
let browser
try {
  const preview = await startPreview()
  server = preview.server
  const { base } = preview
  browser = await launchChromium()
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  await page.goto(`${base}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  await mkdir('artifacts/inspection', { recursive: true })
  const root = page.locator('[data-presentation-root]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (!count) throw new Error(`route ${slug} did not expose presentation step hooks`)
  const settleMs = Number(process.env.INSPECT_SETTLE_MS) || 900
  for (let i = 0; i < count; i++) {
    if (i) await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(settleMs)
    const actual = Number(await root.getAttribute('data-step-index'))
    if (actual !== i) throw new Error(`step ${i + 1}: expected index ${i}, got ${actual}`)
    await page.screenshot({ path: `artifacts/inspection/${slug}-${String(i + 1).padStart(2, '0')}.png`, fullPage: true })
    for (const warning of await collectVisualWarnings(page)) console.warn(`WARN step ${i + 1}: ${warning}`)
  }
  console.log(`Captured ${count} settled steps in artifacts/inspection/`)
} finally {
  await browser?.close()
  await server?.close()
}
