import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build, withPreview, openPresentation, waitStep, assertClean, SETTLE_MS } from './browser.mjs'
import { visualDiagnostics } from './diagnostics.mjs'
export async function inspectPresentation({ cwd = process.cwd(), slug, settleMs = SETTLE_MS, viewport = { width: 1440, height: 900 }, onCapture } = {}) {
  if (!Number.isFinite(settleMs) || settleMs < 0) throw new Error('Invalid settle interval')
  const config = JSON.parse(await readFile(resolve(cwd, 'presentation.config.json'), 'utf8'))
  const target = slug ?? config.slug
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(target)) throw new Error('Invalid slug')
  await build(cwd)
  const output = resolve(cwd, 'artifacts/inspection', target, `${viewport.width}x${viewport.height}`)
  await mkdir(output, { recursive: true })
  const report = []
  await withPreview(cwd, async (browser, url) => {
    const { page, count, errors } = await openPresentation(browser, url, target, viewport)
    for (let index = 0; index < count; index++) {
      await waitStep(page, index)
      const started = Date.now()
      await page.waitForTimeout(settleMs)
      assertClean(errors, index)
      const warnings = await page.evaluate(visualDiagnostics)
      for (const warning of warnings) console.warn(`ADVISORY step ${index}: ${warning}`)
      const file = resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      const record = { index, file, warnings, waitedMs: Date.now() - started }
      report.push(record)
      await onCapture?.(record)
      if (index + 1 < count) await page.keyboard.press('ArrowRight')
    }
    await page.close()
  })
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(`Inspection artifacts: ${output}; warnings are advisory, review composition separately.`)
  return report
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  inspectPresentation({ slug: process.argv.slice(2).find(arg => !arg.startsWith('--')), viewport: process.argv.includes('--narrow') ? { width: 390, height: 844 } : undefined }).catch(error => { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 })
}
