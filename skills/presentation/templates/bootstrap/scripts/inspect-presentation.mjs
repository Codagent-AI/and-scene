import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { command, parseOptions, visitSteps, withPreview } from './browser.mjs'
import { chromeWarnings, measurePage, overlapWarnings } from './diagnostics.mjs'
export async function inspect(options) {
  if (!options.slug) throw new Error('Usage: npm run inspect -- <registered-slug> [--settle 1000] [--width 1440] [--height 900]')
  await command('npm', ['run', 'build'])
  const directory = `artifacts/inspection/${options.slug}/${options.width ?? 1440}x${options.height ?? 900}`
  await mkdir(directory, { recursive: true })
  const report = []
  await withPreview((page, url) => visitSteps(page, url, options.slug, { ...options, capture: async index => {
    const measurements = await page.evaluate(measurePage)
    const warnings = [...overlapWarnings(measurements.elements), ...chromeWarnings(measurements)]
    warnings.forEach(warning => console.warn(`ADVISORY step ${index}: ${warning}`))
    const file = `${directory}/step-${String(index + 1).padStart(2, '0')}.png`
    await page.screenshot({ path: file })
    report.push({ index, file, capturedAt: Date.now(), warnings })
  } }), options)
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2))
  console.log(`Inspection artifacts: ${directory} (advisory warnings do not fail verification)`)
  return report
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await inspect(parseOptions(process.argv.slice(2))) } catch (error) { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 }
}
