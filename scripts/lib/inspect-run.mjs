import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { analyzeSnapshot, collectSnapshot, formatWarning } from './diagnostics.mjs'
import { parseArgs, screenshotPath } from './inspect-args.mjs'
import { HOST, waitForStepIndex } from './preview.mjs'

/**
 * Capture every step of a registered presentation and print advisory
 * warnings. Resolves to the process exit code: warnings never change it,
 * a capture failure does.
 */
export async function runInspect(argv, deps) {
  const { root, log, warn = console.log, error, build, startPreview, launchBrowser, readRegistry } = deps
  let preview
  let browser
  try {
    const options = parseArgs(argv, root)
    if (!readRegistry(root).some((entry) => entry.slug === options.slug)) {
      throw new Error(`"${options.slug}" is not registered in src/presentations/index.ts`)
    }
    if (options.build) {
      log('npm run build')
      const result = await build(root)
      if (result.code !== 0) {
        throw new Error(`npm run build failed\n${result.output.trim().split('\n').slice(-25).join('\n')}`)
      }
    }

    preview = await startPreview(root, log)
    browser = await launchBrowser()
    const page = await browser.newPage({ viewport: options.viewport })
    const url = `http://${HOST}:${new URL(preview.base).port}/${options.slug}`
    log(`opening ${url} at ${options.viewport.width}x${options.viewport.height}`)
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForSelector('[data-step-count]', { timeout: 10_000 })
    const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
    await mkdir(path.join(options.outDir, options.slug), { recursive: true })

    let warnings = 0
    for (let index = 0; index < count; index++) {
      await waitForStepIndex(page, index)
      await page.waitForTimeout(options.settleMs)
      const file = screenshotPath(options.outDir, options.slug, index)
      await page.screenshot({ path: file })
      log(`step ${index + 1}/${count} -> ${path.relative(root, file)}`)
      const snapshot = await page.evaluate(`(${collectSnapshot.toString()})(document, window)`)
      for (const warning of analyzeSnapshot(snapshot, index + 1)) {
        warnings++
        warn(formatWarning(warning))
      }
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    log(`captured ${count} step(s); ${warnings} advisory warning(s)`)
    return 0
  } catch (failure) {
    error(`inspect failed: ${failure.message}`)
    return 1
  } finally {
    await browser?.close().catch(() => {})
    await preview?.stop()
  }
}
