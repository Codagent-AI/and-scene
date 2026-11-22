import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { command, withPreview, visitSteps, SETTLE_MS } from './browser.mjs'
import { collectDiagnostics } from './diagnostics.mjs'
import { REFERENCE_SLUG } from './reference.mjs'

export async function inspectPresentation({ cwd = process.cwd(), slug = REFERENCE_SLUG, width = 1440, height = 900, settle = SETTLE_MS, build = true } = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('invalid presentation slug')
  if (![width, height, settle].every(Number.isFinite) || width < 1 || height < 1 || settle < SETTLE_MS) throw new Error(`invalid viewport or settle interval (minimum ${SETTLE_MS}ms)`)
  if (build) await command('npm', ['run', 'build'], cwd)
  const directory = resolve(cwd, 'artifacts/inspect', slug, `${width}x${height}`)
  await mkdir(directory, { recursive: true })
  const report = []
  await withPreview(async ({ page, origin }) => {
    await page.goto(origin)
    if (await page.locator(`a[href="/${slug}"]`).count() !== 1) throw new Error(`missing registered presentation ${slug}`)
    await visitSteps(page, `${origin}/${slug}`, async ({ page, step }) => {
      const warnings = await page.evaluate(collectDiagnostics)
      for (const warning of warnings) console.warn(`ADVISORY step ${step}: ${warning}`)
      const filename = `step-${String(step + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: resolve(directory, filename), fullPage: true })
      report.push({ step, filename, settle, capturedAt: Date.now(), warnings })
    }, { settle })
  }, { cwd, viewport: { width, height } })
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(`inspection: ${report.length} settled screenshots in ${directory}; warnings are advisory`)
  return report
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const option = (name, fallback) => {
    const inline = args.find((arg) => arg.startsWith(name + '='))
    return inline ? Number(inline.slice(name.length + 1)) : args.includes(name) ? Number(args[args.indexOf(name) + 1]) : fallback
  }
  inspectPresentation({ slug: args[0] ?? REFERENCE_SLUG, width: option('--width', 1440), height: option('--height', 900), settle: option('--settle', SETTLE_MS) }).catch((error) => {
    console.error(`FAIL: inspection: ${error.message}`)
    process.exitCode = 1
  })
}
