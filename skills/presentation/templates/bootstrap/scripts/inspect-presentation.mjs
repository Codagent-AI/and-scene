import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build, SETTLE_MS, visitSteps, withBrowser } from './browser.mjs'
import { collectVisuals, diagnose } from './diagnostics.mjs'
const args = process.argv.slice(2)
const slug = args.find(arg => !arg.startsWith('--'))
try {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('usage: npm run inspect -- <registered-slug> [--built] [--narrow]')
  if (!args.includes('--built')) build()
  const viewport = args.includes('--narrow') ? { width: 390, height: 844 } : { width: 1440, height: 900 }
  const directory = join('artifacts', 'inspection', slug, `${viewport.width}x${viewport.height}`)
  await mkdir(directory, { recursive: true })
  const records = []
  await withBrowser(async (page, base) => {
    await visitSteps(page, `${base}/${slug}`, async ({ index }) => {
      const warnings = diagnose(await page.evaluate(collectVisuals))
      for (const warning of warnings) console.warn(`ADVISORY step ${index}: ${warning}`)
      const filename = join(directory, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: filename })
      records.push({ index, filename, settleMs: SETTLE_MS, capturedAt: Date.now(), warnings })
    })
  }, { viewport })
  await writeFile(join(directory, 'report.json'), JSON.stringify(records, null, 2))
  console.log(`PASS capture: ${records.length} settled screenshots in ${directory}; warnings are advisory`)
} catch (error) { console.error(`FAIL inspect: ${error.message}`); process.exitCode = 1 }
