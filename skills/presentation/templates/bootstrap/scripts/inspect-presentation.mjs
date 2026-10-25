import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build, withPreview, browserErrors, visit, advance } from './browser.mjs'
import { collectDiagnostics, diagnose } from './diagnostics.mjs'

export async function inspect({ cwd = process.cwd(), slug, settle = 850, skipBuild = false, output = resolve(cwd, 'artifacts/inspection', slug ?? ''), viewport } = {}) {
  if (!slug) throw new Error('inspection: supply a registered presentation slug')
  if (!Number.isFinite(settle) || settle < 0) throw new Error('inspection: settle interval must be non-negative')
  if (!skipBuild) build(cwd)
  await mkdir(output, { recursive: true })
  const captures = []
  await withPreview(async (page, baseURL) => {
    const errors = browserErrors(page)
    const { count } = await visit(page, baseURL, slug, errors)
    for (let index = 0; index < count; index++) {
      if (index) await advance(page, index, errors)
      const transitionAt = Date.now()
      await page.waitForTimeout(settle)
      errors.assertClean()
      const warnings = diagnose(await page.evaluate(collectDiagnostics))
      const file = `${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: resolve(output, file) })
      captures.push({ index, file, transitionAt, capturedAt: Date.now(), settle, warnings })
      for (const warning of warnings) console.warn(`WARN step ${index}: ${warning}`)
      console.log(`capture: step ${index} ${resolve(output, file)}`)
    }
  }, { cwd, viewport })
  await writeFile(resolve(output, 'report.json'), JSON.stringify(captures, null, 2) + '\n')
  console.log('inspection: captures complete; visual warnings are advisory')
  return captures
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const settleArg = process.argv.find(arg => arg.startsWith('--settle='))
  inspect({ slug: process.argv[2], settle: settleArg ? Number(settleArg.split('=')[1]) : undefined }).catch(error => { console.error(`FAIL: ${error.message}`); process.exitCode = 1 })
}
