import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, withBrowser, projectRoot, SETTLE_MS, assertIndex, isMain } from './browser.mjs'
import { collectDiagnostics } from './diagnostics.mjs'
export async function inspectPresentation({ root = projectRoot, slug, build = true, settle = SETTLE_MS, viewport = { width: 1440, height: 900 } }) {
  if (!/^[a-z0-9-]+$/.test(slug ?? '')) throw new Error('Provide a registered presentation slug')
  if (build) await command('npm', ['run', 'build'], root)
  const directory = resolve(root, 'artifacts/inspections', slug)
  await mkdir(directory, { recursive: true })
  return withBrowser(root, async (page, url) => {
    await page.goto(url)
    if (await page.locator(`a[href="/${slug}"]`).count() !== 1) throw new Error(`Missing registered presentation: ${slug}`)
    await page.goto(`${url}/${slug}`); await assertIndex(page, 0)
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    const report = []
    for (let index = 0; index < count; index++) {
      const started = Date.now()
      if (index) { await page.keyboard.press('ArrowRight'); await assertIndex(page, index) }
      await page.waitForTimeout(settle)
      const warnings = await page.evaluate(collectDiagnostics)
      warnings.forEach(warning => console.warn(`ADVISORY ${warning}`))
      const file = `step-${String(index + 1).padStart(2, '0')}.png`
      const elapsedBeforeCapture = Date.now() - started
      await page.screenshot({ path: resolve(directory, file), fullPage: true })
      report.push({ index, file, elapsedBeforeCapture, settle, warnings })
      console.log(`CAPTURE step ${index}: ${file} (settled ${settle}ms)`)
    }
    await writeFile(resolve(directory, 'report.json'), JSON.stringify({ viewport, steps: report }, null, 2))
    return report
  }, viewport)
}
if (isMain(import.meta.url)) await inspectPresentation({ slug: process.argv[2] }).catch(error => { console.error(`FAIL inspect: ${error.message}`); process.exitCode = 1 })
