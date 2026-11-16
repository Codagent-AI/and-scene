import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOT, SETTLE_MS, command, withPreview, settle, stepTo, browseRoot } from './browser.mjs'
import { collectDiagnostics, warningsFor } from './diagnostics.mjs'
export async function inspect({ route, root = ROOT, settleMs = SETTLE_MS, viewport = { width: 1440, height: 900 }, build = true } = {}) {
  if (!route || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route)) throw new Error('Pass a registered presentation slug')
  if (build) await command('npm', ['run', 'build'], root)
  const directory = resolve(root, 'artifacts/inspection', route, `${viewport.width}x${viewport.height}`)
  await mkdir(directory, { recursive: true })
  const manifest = []
  await withPreview(async (page, base) => {
    await page.goto(`${base}/${route}`)
    const hook = await browseRoot(page)
    const count = Number(await hook.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('Invalid step count')
    for (let index = 0; index < count; index++) {
      await stepTo(page, index)
      const advancedAt = Date.now()
      await settle(page, settleMs)
      const data = await page.evaluate(collectDiagnostics)
      const warnings = warningsFor(data, index)
      warnings.forEach(w => console.warn(`ADVISORY ${w}`))
      const path = resolve(directory, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path })
      manifest.push({ index, file: path, advancedAt, capturedAt: Date.now(), settleMs, warnings })
      console.log(`CAPTURE step ${index} ${path}`)
    }
  }, { root, viewport })
  await writeFile(resolve(directory, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`Inspection artifacts: ${directory}; warnings are advisory and require visual review.`)
  return manifest
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  try { await inspect({ route: args[0], viewport: args.includes('--narrow') ? { width: 390, height: 844 } : undefined }) }
  catch (error) { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 }
}
