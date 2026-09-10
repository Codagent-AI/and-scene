import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { withPresentationPage } from './lib/presentation-page.mjs'
import { collectVisualDiagnostics } from './lib/visual-diagnostics.mjs'

const slug = process.argv[2]?.replace(/^\/+|\/+$/g, '')
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')

const port = 4174
const settleMs = 650
const outputDirectory = resolve(process.cwd(), 'inspection', slug)
const warn = (step, message) => console.warn(`VISUAL WARNING step ${step + 1}: ${message}`)

await withPresentationPage(port, slug, async (page, url) => {
  await mkdir(outputDirectory, { recursive: true })
  await page.goto(url, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation-root]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`Route /${slug} did not render a presentation`)
  for (let index = 0; index < count; index += 1) {
    await page.waitForFunction((expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === expected, String(index))
    await delay(settleMs)
    await page.screenshot({ path: resolve(outputDirectory, `${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    const diagnostics = await page.evaluate(collectVisualDiagnostics)
    if (diagnostics.collisions.length) warn(index, `unmarked visible text/chrome overlap: ${diagnostics.collisions[0]}`)
    if (diagnostics.noActiveState || diagnostics.indistinct) warn(index, 'active progress or table-of-contents state is visually indistinct')
    if (!diagnostics.attribution) warn(index, 'missing data-presentation-attribution')
    else if (!diagnostics.attribution.linked || diagnostics.attribution.fontSize < 12 || diagnostics.attribution.browserDefault) warn(index, 'attribution is unlinked, undersized, or browser-default styled')
    if (index + 1 < count) await page.keyboard.press('ArrowRight')
  }
  console.log(`Captured ${slug} screenshots in ${outputDirectory}`)
})
