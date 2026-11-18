import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build, collectErrors, parseOptions, sleep, stepCount, waitForStep, withBrowser } from './browser-runtime.mjs'
import { visualDiagnostics } from './diagnostics.mjs'

export async function inspectPresentation(options, cwd = process.cwd()) {
  if (!options.slug) throw new Error('inspection: provide a registered presentation slug')
  await build(cwd)
  const directory = resolve(cwd, 'artifacts/inspection', options.slug, `${options.width}x${options.height}`)
  await mkdir(directory, { recursive: true })
  const manifest = []
  await withBrowser(cwd, async (page, base) => {
    const errors = collectErrors(page)
    await page.goto(`${base}/${options.slug}`)
    const count = await stepCount(page)
    for (let index = 0; index < count; index++) {
      await waitForStep(page, index)
      const stepStartedAt = Date.now()
      await sleep(options.settle)
      if (errors.length) throw new Error(`inspection step ${index}: ${errors.join('; ')}`)
      const warnings = await page.evaluate(visualDiagnostics)
      const activeAnimations = await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)
      const image = `step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: join(directory, image), fullPage: true, animations: 'allow' })
      const capturedAt = Date.now()
      manifest.push({ index, image, stepStartedAt, capturedAt, settledForMs: capturedAt - stepStartedAt, activeAnimations, warnings })
      for (const warning of warnings) console.warn(`ADVISORY step ${index}: ${warning}`)
      console.log(`captured step ${index}: ${join(directory, image)} (settled ${capturedAt - stepStartedAt}ms)`)
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
  }, { width: options.width, height: options.height })
  await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(`Inspection artifacts: ${directory}; warnings are advisory, not visual-quality pass/fail judgments.`)
  return manifest
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  inspectPresentation(parseOptions(process.argv.slice(2))).catch((error) => { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 })
}
