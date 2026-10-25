import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { command, stepCount, visitSteps, withBrowser, SETTLE_MS } from './browser.mjs'
import { collectDiagnostics } from './diagnostics.mjs'

export async function inspect({ cwd = process.cwd(), slug, settleMs = SETTLE_MS, build = true } = {}) {
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error('Supply a registered presentation slug')
  if (build) await command('npm', ['run', 'build'], cwd)
  const directory = resolve(cwd, '.artifacts/inspection', slug)
  await mkdir(directory, { recursive: true })
  const report = []
  await withBrowser(cwd, async (page, url) => {
    await page.goto(`${url}/${slug}`)
    const { hook, count } = await stepCount(page)
    await visitSteps(page, count, hook, async index => {
      const warnings = await page.evaluate(collectDiagnostics)
      for (const warning of warnings) console.warn(`ADVISORY ${warning}`)
      const filename = `step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: resolve(directory, filename), fullPage: true })
      report.push({ index, filename, settledMs: settleMs, warnings, capturedAt: Date.now() })
    }, settleMs)
  })
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`Inspection artifacts: ${directory} (advisory only)`)
  return report
}
if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  inspect({ slug: process.argv[2] }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
