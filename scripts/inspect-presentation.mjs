import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build, withPreview, captureErrors, assertClean, stepIndex, SETTLE_MS } from './browser.mjs'
import { diagnose } from './diagnostics.mjs'
export async function inspect({ cwd = process.cwd(), slug, settle = SETTLE_MS, width = 1440, height = 900 } = {}) {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('inspect: provide a registered presentation slug')
  await build(cwd)
  const directory = resolve(cwd, '.presentation-artifacts', slug, `${width}x${height}`)
  await mkdir(directory, { recursive: true })
  const records = []
  await withPreview(cwd, async (browser, url) => {
    const page = await browser.newPage({ viewport: { width, height } }), errors = captureErrors(page)
    await page.goto(`${url}/${slug}`)
    await page.locator('[data-step-count]').waitFor({ timeout: 5000 })
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('inspect: invalid step count')
    for (let index = 0; index < count; index++) {
      if (index) await page.keyboard.press('ArrowRight')
      await stepIndex(page, index)
      const transitionObservedAt = Date.now()
      await page.waitForTimeout(settle)
      assertClean(errors, index)
      const warnings = await page.evaluate(diagnose)
      warnings.forEach(warning => console.warn(`ADVISORY step ${index}: ${warning}`))
      const file = `step-${String(index + 1).padStart(2, '0')}.png`
      const capturedAt = Date.now()
      await page.screenshot({ path: resolve(directory, file) })
      records.push({ index, file, transitionObservedAt, capturedAt, settle, warnings })
      console.log(`CAPTURE step ${index}: ${file}`)
    }
  })
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(records, null, 2) + '\n')
  console.log(`Inspection artifacts: ${directory}; warnings are advisory, review composition separately.`)
  return { directory, records }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const widthAt = process.argv.indexOf('--width')
  inspect({ slug: process.argv[2], width: widthAt < 0 ? undefined : Number(process.argv[widthAt + 1]) }).catch(error => { console.error(`FAIL ${error.message}`); process.exitCode = 1 })
}
