import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, SETTLE_MS, walkSteps, withBrowser } from './browser.mjs'
import { collectDiagnostics } from './diagnostics.mjs'
export async function inspect({ route, cwd = process.cwd(), build = true, settle = SETTLE_MS, viewport = { width: 1440, height: 900 }, output } = {}) {
  if (!route || !/^[a-z0-9-]+$/.test(route)) throw new Error('Provide a registered presentation slug')
  if (!Number.isFinite(settle) || settle < SETTLE_MS) throw new Error(`Settle interval must be at least ${SETTLE_MS}ms`)
  if (!viewport || !Number.isInteger(viewport.width) || !Number.isInteger(viewport.height) || viewport.width <= 0 || viewport.height <= 0) throw new Error('Viewport requires positive integer width and height')
  if (build) await command('npm', ['run','build'], cwd)
  const derivedOutput = resolve(cwd, '.inspection', route, `${viewport.width}x${viewport.height}`)
  const destination = output === undefined ? derivedOutput : resolve(output)
  // Only clear the helper-owned route/viewport directory, never an arbitrary override.
  if (destination === derivedOutput) await rm(destination, { recursive: true, force: true })
  await mkdir(destination, { recursive: true })
  const report = []
  await withBrowser(async (page, url) => {
    await walkSteps(page, url, route, async (page, index, _count, timing) => {
      const warnings = await page.evaluate(collectDiagnostics)
      const file = `step-${String(index + 1).padStart(2,'0')}.png`
      const captureStartedAt = Date.now()
      await page.screenshot({ path: resolve(destination, file), fullPage: true })
      for (const warning of warnings) console.warn(`ADVISORY step ${index}: ${warning}`)
      report.push({ index, file, settle, ...timing, captureStartedAt, capturedAt: Date.now(), warnings })
    }, { settle })
  }, { cwd, viewport })
  await writeFile(resolve(destination,'report.json'), JSON.stringify(report,null,2)+'\n')
  console.log(`CAPTURED ${report.length} steps in ${destination}; warnings are advisory`)
  return report
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const args = process.argv.slice(2)
  inspect({ route: args[0], build: !args.includes('--skip-build'), viewport: args.includes('--narrow') ? { width: 390, height: 844 } : undefined }).catch(error => { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 })
}
