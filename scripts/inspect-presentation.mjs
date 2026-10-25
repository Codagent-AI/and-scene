import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { command, withPreview, monitorErrors, stepCount, advance, SETTLE_MS } from './browser.mjs'
import { collectDiagnostics, diagnose } from './diagnostics.mjs'
const slug = process.argv[2]
function option(name, fallback) { const i = process.argv.indexOf(name); return i < 0 ? fallback : Number(process.argv[i + 1]) }
try {
 if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('usage: npm run inspect -- <registered-slug> [--width 1440 --height 900 --settle 1200]')
 const width = option('--width', 1440), height = option('--height', 900), settle = option('--settle', SETTLE_MS)
 if (![width, height, settle].every(n => Number.isFinite(n) && n > 0)) throw new Error('viewport and settle must be positive')
 await command('npm', ['run', 'build'])
 const directory = path.join('artifacts', 'inspection', slug, `${width}x${height}`)
 await mkdir(directory, { recursive: true })
 const report = { viewport: { width, height }, settle, captures: [] }
 await withPreview(async (browser, base) => {
  report.url = `${base}/${slug}`
  const page = await browser.newPage({ viewport: { width, height } }), errors = monitorErrors(page)
  await page.goto(report.url)
  const count = await stepCount(page)
  for (let i = 0; i < count; i++) {
   errors.setStep(i)
   if (i) await advance(page, i)
   const transitionedAt = Date.now()
   await page.waitForTimeout(settle); errors.check()
   const warnings = diagnose(await page.evaluate(collectDiagnostics), i)
   for (const warning of warnings) console.log(`ADVISORY ${warning}`)
   const file = path.join(directory, `step-${String(i + 1).padStart(2, '0')}.png`)
   const capturedAt = Date.now()
   // A textual fingerprint makes accidental repeated-step capture detectable.
   const content = await page.locator('[data-presentation-root]').innerText()
   await page.screenshot({ path: file })
   report.captures.push({ index: i, file, transitionedAt, capturedAt, content, warnings })
   console.log(`CAPTURE step ${i}: ${file}`)
  }
 })
 await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2))
 console.log('PASS capture; advisory warnings require composition review')
} catch (error) { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 }
