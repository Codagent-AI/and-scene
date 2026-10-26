import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, withBrowser, options, stepIndex, SETTLE_MS } from './browser-tools.mjs'
import { collectDiagnostics, diagnostics } from './diagnostics.mjs'
const args = options(process.argv.slice(2))
try {
  if (!args.slug || !/^[a-z0-9-]+$/.test(args.slug)) throw new Error('Usage: npm run inspect -- <registered-slug> [--settle 850] [--output path]')
  const settle = Number(args.settle ?? SETTLE_MS)
  if (!Number.isFinite(settle) || settle < 0) throw new Error('settle must be a non-negative interval in milliseconds')
  if (!args['skip-build']) await command('npm', ['run', 'build'])
  const output = resolve(args.output || `artifacts/inspection/${args.slug}`)
  await mkdir(output, { recursive: true })
  const report = { slug: args.slug, settle, viewport: { width: 1440, height: 900 }, steps: [] }
  await withBrowser(process.cwd(), async (browser, base) => {
    const page = await browser.newPage({ viewport: report.viewport })
    await page.goto(base)
    await page.locator(`a[href="/${args.slug}"]`).waitFor()
    await page.goto(`${base}/${args.slug}`)
    await stepIndex(page, 0)
    await page.evaluate(() => document.fonts.ready)
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('Invalid data-step-count')
    for (let index = 0; index < count; index++) {
      if (index) { await page.keyboard.press('ArrowRight'); await stepIndex(page, index) }
      const arrived = Date.now()
      await page.waitForTimeout(settle)
      const captured = Date.now()
      const file = `step-${String(index + 1).padStart(2, '0')}.png`
      const warnings = diagnostics(await page.evaluate(collectDiagnostics), index)
      for (const warning of warnings) console.log(`[advisory] ${warning}`)
      await page.screenshot({ path: resolve(output, file) })
      report.steps.push({ index, file, arrived, captured, warnings })
    }
  })
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`Captured ${report.steps.length} settled steps in ${output}; visual warnings are advisory`)
} catch (error) { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 }
