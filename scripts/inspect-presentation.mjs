import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build, isMain, projectRoot, readStepCount, settleStep, watchErrors, withBrowser } from './browser-runtime.mjs'
import { collectDiagnostics, diagnose } from './diagnostics.mjs'
export async function inspect({ slug, root = projectRoot, width = 1440, height = 900, settle = 850, skipBuild = false } = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error('Usage: npm run inspect -- <registered-slug> [--width N] [--height N] [--settle N]')
  if (![width,height,settle].every(Number.isFinite) || width < 1 || height < 1 || settle < 0) throw new Error('Invalid viewport or settle interval')
  if (!skipBuild) await build(root)
  const directory = resolve(root, 'artifacts/inspection', slug, `${width}x${height}`)
  await mkdir(directory, { recursive: true })
  const reports = []
  await withBrowser(async (page, url) => {
    const checkErrors = watchErrors(page)
    await page.goto(`${url}/${slug}`)
    const count = await readStepCount(page)
    for (let index = 0; index < count; index++) {
      const started = Date.now()
      await settleStep(page, index, settle)
      checkErrors()
      const warnings = diagnose(await page.evaluate(collectDiagnostics))
      for (const warning of warnings) console.warn(`ADVISORY step ${index}: ${warning}`)
      const file = `step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: resolve(directory, file) })
      reports.push({ index, file, settle, elapsedBeforeCapture: Date.now() - started, warnings })
      console.log(`CAPTURE step ${index}: ${file}`)
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
  }, { root, width, height })
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(reports, null, 2))
  console.log(`Inspection artifacts: ${directory}; warnings are advisory, visual review is required.`)
  return reports
}
if (isMain(import.meta.url)) {
  const option = (name, fallback) => { const i = process.argv.indexOf(name); return i < 0 ? fallback : Number(process.argv[i + 1]) }
  inspect({ slug: process.argv[2], width: option('--width', 1440), height: option('--height', 900), settle: option('--settle', 850) }).catch(error => { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 })
}
