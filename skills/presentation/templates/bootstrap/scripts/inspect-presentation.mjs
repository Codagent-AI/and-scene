import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { command, options, withBrowser, SETTLE_MS } from './browser-runtime.mjs'
import { collectVisualWarnings } from './visual-diagnostics.mjs'
export async function inspectPresentation({ slug = 'how-to-make-a-presentation', noBuild = false, settle = SETTLE_MS, width = 1440, height = 900 } = {}) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Invalid presentation slug')
  if (!Number.isFinite(settle) || settle < SETTLE_MS) throw new Error(`Settle interval must be at least ${SETTLE_MS}ms`)
  if (!noBuild) await command('npm', ['run', 'build'])
  const directory = `artifacts/inspection/${slug}/${width}x${height}`
  await mkdir(directory, { recursive: true })
  const captures = []
  await withBrowser(async (page, origin) => {
    await page.goto(origin)
    if (!await page.locator(`a[href="/${slug}"]`).count()) throw new Error(`Unregistered presentation: ${slug}`)
    await page.goto(`${origin}/${slug}`)
    const host = page.locator('[data-presentation]'); await host.waitFor()
    if (await host.getAttribute('data-presentation-mode') === 'present') await page.keyboard.press('p')
    const count = Number(await host.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('Invalid step count')
    for (let index = 0; index < count; index++) {
      if (index) await page.keyboard.press('ArrowRight')
      await page.waitForFunction(i => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(i), index)
      await page.waitForTimeout(settle)
      const warnings = await page.evaluate(collectVisualWarnings)
      for (const warning of warnings) console.warn(`ADVISORY step ${index}: ${warning}`)
      const file = `${directory}/step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: file })
      captures.push({ index, file, warnings, settledFor: settle })
      console.log(`CAPTURE step ${index}: ${file}`)
    }
  }, { viewport: { width, height } })
  await writeFile(`${directory}/report.json`, JSON.stringify(captures, null, 2))
  return captures
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const config = options(args)
  if (args[0] && !args[0].startsWith('--')) config.slug = args[0]
  try { await inspectPresentation(config) } catch (error) { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 }
}
