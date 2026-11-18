import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { withPreview, sleep } from './browser.mjs'
import { inspectDOM } from './diagnostics.mjs'
export async function captureStep(page, index, settle, path) {
  await page.waitForFunction(i => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3500 })
  await sleep(settle)
  const warnings = await page.evaluate(inspectDOM)
  await page.screenshot({ path, animations: 'allow' })
  return warnings
}
export async function inspectPresentation(slug, { cwd = process.cwd(), settle = 900, build = true, output = resolve(cwd, 'artifacts/inspection', slug), onCapture } = {}) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Expected a registered presentation slug')
  if (build && spawnSync('npm', ['run', 'build'], { cwd, stdio: 'inherit', timeout: 180000 }).status !== 0) throw new Error('Inspection build failed')
  await mkdir(output, { recursive: true })
  return withPreview(async ({ browser, url }) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${url}/${slug}`)
    await page.locator('[data-step-count]').waitFor({ timeout: 5000 })
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('Invalid step count')
    const results = []
    for (let index = 0; index < count; index++) {
      if (index) await page.keyboard.press('ArrowRight')
      const path = resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`)
      const warnings = await captureStep(page, index, settle, path)
      for (const warning of warnings) console.log(`WARN step ${index}: ${warning}`)
      console.log(`capture step ${index}: ${path}`)
      if (onCapture) await onCapture({ page, index, path, warnings })
      results.push({ index, path, warnings })
    }
    return results
  }, { cwd })
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  inspectPresentation(process.argv[2]).catch(error => { console.error(`FAIL inspect: ${error.message}`); process.exitCode = 1 })
}
