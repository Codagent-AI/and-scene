#!/usr/bin/env node
// Capture one settled screenshot per step from a production preview and print
// advisory visual warnings. Warnings never change the exit code; only
// operational failures (unknown slug, failed build or preview) do.
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { PROJECT_ROOT, launchBrowser, readRegistry, runBuild, startPreview } from './lib/project.mjs'
import { ACTIVE_STYLE_PROPS, analyzeSnapshot, collectSnapshot } from './lib/diagnostics.mjs'
import { parseArgs, screenshotName } from './lib/inspect-args.mjs'

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const registry = await readRegistry(PROJECT_ROOT)
  if (!registry.some((entry) => entry.slug === options.slug)) {
    throw new Error(`unknown presentation "${options.slug}"; registered: ${registry.map((e) => e.slug).join(', ') || 'none'}`)
  }
  const outDir = path.resolve(options.out ?? path.join(PROJECT_ROOT, '.presentation-inspect', options.slug))
  if (!options.skipBuild) {
    const build = await runBuild(PROJECT_ROOT)
    if (build.code !== 0) throw new Error(`npm run build failed:\n${build.output.split('\n').slice(-40).join('\n')}`)
  }
  await mkdir(outDir, { recursive: true })

  const preview = await startPreview(PROJECT_ROOT)
  const browser = await launchBrowser().catch(async (error) => {
    await preview.stop()
    throw error
  })
  const warnings = []
  console.log(`inspect: preview ${preview.url}`)
  try {
    const page = await browser.newPage({ viewport: { width: options.width, height: options.height } })
    let current = 1
    const browserErrors = []
    page.on('console', (m) => {
      if (m.type() === 'error') browserErrors.push(`step ${current}: console error: ${m.text()}`)
    })
    page.on('pageerror', (e) => browserErrors.push(`step ${current}: uncaught error: ${e.message}`))
    await page.goto(`${preview.url}/${options.slug}`)
    await page.waitForSelector('[data-presentation-root]', { timeout: 10000 })
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    for (let i = 0; i < count; i++) {
      current = i + 1
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
          i,
          { timeout: 5000 },
        )
      }
      await page.waitForTimeout(options.settleMs)
      for (const message of browserErrors.splice(0)) {
        warnings.push(message)
        console.log(`WARN ${message}`)
      }
      await page.screenshot({ path: path.join(outDir, screenshotName(i)) })
      const snapshot = await page.evaluate(collectSnapshot, ACTIVE_STYLE_PROPS)
      for (const warning of analyzeSnapshot(i + 1, snapshot)) {
        warnings.push(warning)
        console.log(`WARN ${warning}`)
      }
    }
    console.log(`inspect: captured ${count} screenshots in ${outDir} (${warnings.length} advisory warnings)`)
  } finally {
    await browser.close()
    await preview.stop()
  }
}

main().catch((error) => {
  console.error(`inspect: FAIL ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
