import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { run, withPreview, openPresentation, advance, SETTLE_MS } from './browser.mjs'
import { diagnose, readVisualState } from './diagnostics.mjs'
export async function inspect({ slug, cwd = process.cwd(), build = true, settle = SETTLE_MS, onCapture } = {}) {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Supply a registered presentation slug')
  if (build) await run('npm', ['run', 'build'], cwd)
  const directory = resolve(cwd, '.presentation-artifacts', slug)
  await mkdir(directory, { recursive: true })
  const warnings = []
  await withPreview(cwd, async (browser, base) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const count = await openPresentation(page, base, slug)
    for (let index = 0; index < count; index++) {
      const started = Date.now()
      if (index) await advance(page, index)
      await page.waitForTimeout(settle)
      const findings = diagnose(await page.evaluate(readVisualState), index)
      warnings.push(...findings)
      findings.forEach(w => console.warn(`ADVISORY ${w}`))
      const file = resolve(directory, `${String(index + 1).padStart(2, '0')}.png`)
      const elapsedBeforeCapture = Date.now() - started
      await page.screenshot({ path: file })
      await onCapture?.({ index, file, elapsed: Date.now() - started, elapsedBeforeCapture, viewport: page.viewportSize(), page })
      console.log(`CAPTURE step ${index}: ${file}`)
    }
    await page.close()
  })
  console.log(`Captured screenshots; ${warnings.length} advisory warnings (not a visual pass/fail verdict)`)
  return { directory, warnings }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  inspect({ slug: process.argv[2] }).catch(e => { console.error(`FAIL capture: ${e.message}`); process.exitCode = 1 })
}
