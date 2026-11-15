import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, visitSteps, withPreview, SETTLE_MS } from './browser-session.mjs'
import { visualDiagnostics } from './visual-diagnostics.mjs'
export async function inspect({ cwd = process.cwd(), slug = process.argv[2], settle = SETTLE_MS } = {}) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('inspection: provide a registered presentation slug')
  await build(cwd)
  const output = resolve(cwd, 'artifacts/inspection', slug)
  await mkdir(output, { recursive: true })
  const report = []
  await withPreview(async (browser, base) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await visitSteps(page, `${base}/${slug}`, async (i, _root, { transitionObservedAt }) => {
      const warnings = await page.evaluate(visualDiagnostics)
      const filename = `step-${String(i + 1).padStart(2, '0')}.png`
      const capture = await page.evaluate(() => ({
        captureStartedAt: performance.now(),
        animations: document.getAnimations().map(animation => ({
          id: animation.id, playState: animation.playState,
          startTime: animation.startTime, currentTime: animation.currentTime,
          duration: animation.effect?.getComputedTiming().duration,
        })),
      }))
      await page.screenshot({ path: resolve(output, filename), fullPage: true })
      for (const warning of warnings) console.log(`ADVISORY step ${i}: ${warning}`)
      report.push({ index: i, screenshot: filename, settle, transitionObservedAt, ...capture, capturedAt: Date.now(), warnings })
    }, { settle })
  }, { cwd })
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`inspection: ${report.length} settled screenshots in ${output}; warnings are advisory`)
  return report
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  inspect().catch(error => { console.error(`FAIL: ${error.message}`); process.exitCode = 1 })
}
