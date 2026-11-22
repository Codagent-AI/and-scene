import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildApp, withPreview, openPresentation, advanceTo, delay, DEFAULT_SETTLE_MS } from './browser.mjs'
import { collectDiagnostics, diagnose } from './diagnostics.mjs'
import { REFERENCE_SLUG, validateStepCount } from './reference.mjs'

export async function inspectPresentation({ cwd = process.cwd(), slug = REFERENCE_SLUG, build = true, settleMs = DEFAULT_SETTLE_MS, viewport = { width: 1440, height: 900 } } = {}) {
  if (build) await buildApp(cwd)
  const output = resolve(cwd, 'artifacts/inspection', slug, `${viewport.width}x${viewport.height}`)
  await mkdir(output, { recursive: true })
  const captures = []
  await withPreview(cwd, async ({ browser, origin }) => {
    const { page, errors } = await openPresentation(browser, origin, slug, viewport)
    const count = validateStepCount(await page.locator('[data-presentation]').getAttribute('data-step-count'))
    for (let index = 0; index < count; index++) {
      await advanceTo(page, index)
      const transitionAt = Date.now()
      await delay(settleMs)
      if (errors.length) throw new Error(`render step ${index}: ${errors.join('; ')}`)
      const warnings = diagnose(await page.evaluate(collectDiagnostics))
      for (const warning of warnings) console.warn(`WARN step ${index}: ${warning}`)
      const filename = `step-${String(index + 1).padStart(2, '0')}.png`
      const captureAt = Date.now()
      await page.screenshot({ path: resolve(output, filename), fullPage: true, animations: 'allow' })
      captures.push({ index, filename, transitionAt, captureAt, settleMs, warnings })
      console.log(`capture step ${index}: ${resolve(output, filename)}`)
    }
    await page.close()
  })
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ slug, viewport, captures }, null, 2) + '\n')
  console.log(`Inspection artifacts: ${output}; warnings are advisory.`)
  return { output, captures }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] || '')).href) {
  const width = Number(process.argv[3] || 1440)
  const height = Number(process.argv[4] || 900)
  if (!(width > 0 && height > 0)) throw new Error('viewport: width and height must be positive')
  inspectPresentation({ slug: process.argv[2] || REFERENCE_SLUG, viewport: { width, height } }).catch((error) => {
    console.error(`FAIL inspection: ${error.message}`)
    process.exitCode = 1
  })
}
