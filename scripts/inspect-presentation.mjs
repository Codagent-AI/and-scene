import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { command, withBrowser, walkSteps, SETTLE_MS } from './lib/browser.mjs'
import { collectVisualState, diagnose, captureSettled } from './lib/diagnostics.mjs'

export async function inspectPresentation({ root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), slug, build = true, settle = SETTLE_MS, viewport = { width: 1440, height: 900 } }) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('A registered presentation slug is required')
  if (!Number.isFinite(settle) || settle < SETTLE_MS) throw new Error(`Settle interval must be at least ${SETTLE_MS}ms`)
  if (build) await command('npm', ['run', 'build'], root)
  const output = join(root, '.artifacts', 'inspection', slug, `${viewport.width}x${viewport.height}`)
  await mkdir(output, { recursive: true })
  const warnings = []
  const captures = []
  await withBrowser(root, async (page, base) => {
    await walkSteps(page, `${base}/${slug}`, async (page, index) => {
      // walkSteps settles before diagnostics; captureSettled supplies the configurable final capture delay.
      const state = await page.evaluate(collectVisualState)
      warnings.push(...diagnose(state.elements, state.attribution, index))
      const path = join(output, `step-${String(index + 1).padStart(2, '0')}.png`)
      await captureSettled(page, path, settle)
      captures.push({ index, path, settledMs: settle, viewport, sceneText: await page.locator('[data-presentation-scene]').innerText() })
    })
  }, viewport)
  for (const warning of warnings) console.warn(`ADVISORY: ${warning}`)
  await writeFile(join(output, 'report.json'), JSON.stringify({ captures, warnings }, null, 2))
  console.log(`Captured ${captures.length} settled steps in ${output}; ${warnings.length} advisory warnings (visual review required).`)
  return { captures, warnings, output }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const widthIndex = process.argv.indexOf('--width')
  const width = widthIndex >= 0 ? Number(process.argv[widthIndex + 1]) : 1440
  inspectPresentation({ slug: process.argv[2], build: !process.argv.includes('--no-build'), viewport: { width, height: 900 } }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
