import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { visitSteps, watchErrors, withPreview, SETTLE_MS } from './browser.mjs'
import { collectVisualData, visualWarnings } from './diagnostics.mjs'
export async function inspectPresentation(slug, { cwd = process.cwd(), viewport = { width: 1440, height: 900 }, settle = SETTLE_MS } = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error('inspection: provide a registered kebab-case slug')
  const directory = resolve(cwd, 'artifacts/inspection', slug, `${viewport.width}x${viewport.height}`)
  await mkdir(directory, { recursive: true })
  const report = []
  await withPreview(async ({ page, origin }) => {
    const errors = watchErrors(page)
    await page.goto(origin)
    if (await page.locator(`a[href="/${slug}"]`).count() !== 1) throw new Error(`inspection: unregistered route ${slug}`)
    await visitSteps(page, slug, origin, { errors, settle, capture: async index => {
      const warnings = visualWarnings(await page.evaluate(collectVisualData))
      const file = `step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: resolve(directory, file) })
      report.push({ index, file, capturedAt: Date.now(), settle, warnings })
      for (const warning of warnings) console.warn(`WARN step ${index}: ${warning}`)
    } })
  }, { cwd, viewport })
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(`Inspection artifacts: ${directory}; warnings are advisory, not a visual pass/fail result`)
  return report
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const width = Number(process.argv[3] ?? 1440)
  const height = Number(process.argv[4] ?? 900)
  inspectPresentation(process.argv[2], { viewport: { width, height } }).catch(error => { console.error(`FAIL ${error.message}`); process.exitCode = 1 })
}
