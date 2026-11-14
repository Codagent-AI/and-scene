import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, withBrowser, settleStep, watchErrors, browserFailure, SETTLE_MS } from './browser.mjs'
import { projectRoot } from './reference.mjs'
import { visualDiagnostics } from './diagnostics.mjs'
export async function inspectPresentation({ slug, cwd = projectRoot, build = true, settleMs = SETTLE_MS, viewport = { width: 1440, height: 900 } }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error('Supply a registered presentation slug')
  if (!Number.isFinite(settleMs) || settleMs < SETTLE_MS) throw new Error(`settleMs must be at least ${SETTLE_MS}`)
  if (build) await command('npm', ['run', 'build'], cwd)
  const directory = resolve(cwd, 'artifacts/inspection', slug, `${viewport.width}x${viewport.height}`)
  await mkdir(directory, { recursive: true })
  const report = []
  await withBrowser(cwd, async (page, origin) => {
    const errors = watchErrors(page)
    await page.goto(`${origin}/${slug}`)
    await settleStep(page, 0, settleMs)
    const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('Invalid step count')
    for (let index = 0; index < count; index++) {
      if (index) { await page.keyboard.press('ArrowRight'); await settleStep(page, index, settleMs) }
      if (errors.length) throw browserFailure(index, errors)
      const warnings = await page.evaluate(visualDiagnostics)
      const file = `step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: resolve(directory, file) })
      report.push({ index, file, settleMs, warnings })
      warnings.forEach(warning => console.warn(`ADVISORY ${warning}`))
      console.log(`Captured step ${index}: ${file}`)
    }
  }, { viewport })
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(`Inspection artifacts: ${directory} (warnings are advisory)`)
  return { directory, report }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const width = Number(process.argv.find(arg => arg.startsWith('--width='))?.slice(8) ?? 1440)
  inspectPresentation({ slug: process.argv[2], viewport: { width, height: 900 } }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
