import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { command, withPreview } from './browser-session.mjs'
import { renderSteps } from './verify.mjs'
import { isRegistered } from './reference.mjs'
import { diagnose, readDiagnosticElements } from './diagnostics.mjs'

export async function inspectPresentation(slug, { cwd = process.cwd(), settle = 1000, viewport = { width: 1440, height: 900 }, build = true } = {}) {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('provide a registered presentation slug')
  const registry = await readFile(resolve(cwd, 'src/presentations/index.ts'), 'utf8')
  if (!isRegistered(registry, slug)) throw new Error(`presentation ${slug} not registered`)
  if (build) await command('npm', ['run', 'build'], cwd)
  const directory = resolve(cwd, 'artifacts/inspection', slug, `${viewport.width}x${viewport.height}`)
  await mkdir(directory, { recursive: true })
  const diagnostics = []
  await withPreview((page, origin) => renderSteps(page, origin, slug, { settle, onStep: async (page, index, { activeAt }) => {
    const warnings = diagnose(await page.evaluate(readDiagnosticElements))
    warnings.forEach((warning) => console.warn(`ADVISORY step ${index}: ${warning}`))
    const screenshot = resolve(directory, `step-${String(index + 1).padStart(2, '0')}.png`)
    const captureStartedAt = performance.now()
    await page.screenshot({ path: screenshot, fullPage: true })
    diagnostics.push({ step: index, screenshot, warnings, capturedAt: Date.now(), activeAt, captureStartedAt, settle })
  } }), { cwd, viewport })
  await writeFile(resolve(directory, 'diagnostics.json'), JSON.stringify(diagnostics, null, 2))
  console.log(`inspection artifacts ${directory}`)
  return diagnostics
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const narrow = process.argv.includes('--narrow')
  inspectPresentation(process.argv[2], { viewport: narrow ? { width: 390, height: 844 } : undefined }).catch((error) => { console.error(error.message); process.exitCode = 1 })
}
