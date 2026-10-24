import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readVisualSnapshot, diagnoseVisualSnapshot } from './visual-diagnostics.mjs'
import { parseOptions, readStepCount, run, visitSteps, watchErrors, withPreview } from './browser-runtime.mjs'
export async function inspectPresentation(options, cwd = process.cwd()) {
  if (options.build) await run('npm', ['run', 'build'], cwd)
  const output = resolve(cwd, options.out ?? `.artifacts/inspections/${options.slug}/${options.width}x${options.height}`)
  await mkdir(output, { recursive: true })
  const report = []
  await withPreview(cwd, async (browser, url) => {
    const page = await browser.newPage({ viewport: { width: options.width, height: options.height } })
    const errors = watchErrors(page)
    await page.goto(`${url}/${options.slug}`)
    const count = await readStepCount(page)
    await visitSteps(page, count, async index => {
      if (errors.length) throw new Error(errors.join('; '))
      const warnings = diagnoseVisualSnapshot(await page.evaluate(readVisualSnapshot))
      for (const warning of warnings) console.warn(`ADVISORY step ${index}: ${warning}`)
      const filename = `step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: resolve(output, filename) })
      report.push({ index, filename, warnings, settleMs: options.settleMs, capturedAt: Date.now() })
      console.log(`CAPTURE step ${index}: ${filename}`)
    }, options)
  })
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(`INSPECT artifacts: ${output}; warnings are advisory, not visual pass/fail evidence`)
  return report
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await inspectPresentation(parseOptions(process.argv.slice(2))) } catch (error) { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 }
}
