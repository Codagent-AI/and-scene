import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { build, withBrowser, isMain, argument } from './browser.mjs'
import { diagnose } from './diagnostics.mjs'
export async function inspect({ cwd = process.cwd(), slug, settle = 900, viewport = { width: 1440, height: 900 }, skipBuild = false } = {}) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Provide a registered presentation slug')
  if (!Number.isFinite(settle) || settle < 0) throw new Error('settle interval must be non-negative')
  if (!skipBuild) build(cwd)
  const dir = path.join(cwd, '.presentation-artifacts', slug, `${viewport.width}x${viewport.height}`)
  await mkdir(dir, { recursive: true })
  const report = []
  await withBrowser(cwd, async (page, url) => {
    await page.goto(`${url}/${slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    await root.waitFor()
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('Invalid step count')
    for (let step = 0; step < count; step++) {
      await page.waitForFunction(i => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(i), step)
      const transitionReady = Date.now()
      await page.waitForTimeout(settle)
      const warnings = await page.evaluate(diagnose)
      warnings.forEach(w => console.warn(`ADVISORY: ${w}`))
      const file = `step-${String(step + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: path.join(dir, file), fullPage: true })
      report.push({ step, file, settle, elapsedBeforeCapture: Date.now() - transitionReady, warnings })
      console.log(`capture: step ${step}: ${file}`)
      if (step < count - 1) await page.keyboard.press('ArrowRight')
    }
  }, viewport)
  await writeFile(path.join(dir, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`inspection artifacts: ${dir}; warnings are advisory`)
  return { dir, report }
}
if (isMain(import.meta.url)) inspect({ slug: process.argv[2], settle: Number(argument('--settle', 900)), viewport: { width: Number(argument('--width', 1440)), height: Number(argument('--height', 900)) } }).catch(error => { console.error(error.message); process.exitCode = 1 })
