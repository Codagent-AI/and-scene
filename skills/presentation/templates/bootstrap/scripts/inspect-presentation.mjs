import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { root, command, withPreview, traverse } from './browser.mjs'
import { collectDiagnostics } from './diagnostics.mjs'
const slug = process.argv[2]
const option = (key, fallback) => { const index = process.argv.indexOf(key); return index < 0 ? fallback : Number(process.argv[index + 1]) }
try {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Usage: npm run inspect -- <registered-slug> [--width 1440] [--height 900] [--settle 900]')
  const width = option('--width', 1440), height = option('--height', 900), settle = option('--settle', 900)
  if (![width, height, settle].every(Number.isFinite) || width < 200 || height < 200 || settle < 0) throw new Error('Invalid viewport or settle interval')
  await command('npm', ['run', 'build'])
  const dir = resolve(root, 'artifacts/inspection', slug, `${width}x${height}`)
  await mkdir(dir, { recursive: true })
  const report = []
  await withPreview(async (browser, url) => {
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto(url)
    if (await page.locator(`a[href="/${slug}"]`).count() !== 1) throw new Error(`Unknown registered presentation: ${slug}`)
    await traverse(page, url, slug, async ({ page, index }) => {
      const warnings = await page.evaluate(collectDiagnostics)
      for (const warning of warnings) console.log(`ADVISORY step ${index}: ${warning}`)
      const screenshot = `step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: resolve(dir, screenshot), fullPage: true })
      report.push({ index, screenshot, settle, capturedAt: Date.now(), warnings })
      console.log(`CAPTURE step ${index}: ${screenshot} settled=${settle}ms`)
    }, { settle })
  })
  await writeFile(resolve(dir, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`Artifacts: ${dir}; warnings are advisory, not a visual pass/fail result`)
} catch (error) { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 }
