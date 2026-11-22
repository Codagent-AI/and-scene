/* global document */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { command, readStepCount, SETTLE_MS, waitForStep, withBrowser } from './browser.mjs'
import { collectSnapshot, diagnose } from './diagnostics.mjs'

export async function inspect({ root = process.cwd(), slug, build = true, settleMs = SETTLE_MS, width = 1440, height = 960 } = {}) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('provide a registered presentation slug')
  if (!Number.isFinite(settleMs) || settleMs < 0) throw new Error('settle interval must be non-negative')
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) throw new Error('viewport dimensions must be positive integers')
  const registry = await readFile(resolve(root, 'src/presentations/index.ts'), 'utf8')
  if (!registry.includes(slug)) throw new Error(`presentation ${slug} is not registered`)
  if (build) await command('npm', ['run', 'build'], root)
  const directory = resolve(root, 'artifacts/inspection', slug, `${width}x${height}`)
  await mkdir(directory, { recursive: true })
  return withBrowser(root, async (page, baseURL) => {
    await page.setViewportSize({ width, height })
    await page.goto(`${baseURL}/${slug}`)
    const count = await readStepCount(page)
    const results = []
    for (let index = 0; index < count; index += 1) {
      const started = Date.now()
      if (index) { await page.keyboard.press('ArrowRight'); await waitForStep(page, index) }
      const waitStarted = Date.now()
      await page.waitForTimeout(settleMs)
      // CSS and Web Animations may outlast the configured interval. Ignore
      // decorative infinite loops, but never capture a finite transition midway.
      await page.waitForFunction(() => document.getAnimations().every((animation) =>
        animation.effect?.getComputedTiming().iterations === Infinity ||
        !(animation.pending || animation.playState === 'running')), undefined, { timeout: Math.max(5000, settleMs) })
      const snapshot = await page.evaluate(collectSnapshot)
      const warnings = diagnose(snapshot)
      const filename = `step-${String(index + 1).padStart(2, '0')}.png`
      const captureStarted = Date.now()
      await page.screenshot({ path: resolve(directory, filename), fullPage: true })
      results.push({ index, filename, settleMs, waitedMs: captureStarted - waitStarted, elapsedMs: Date.now() - started, warnings, composition: snapshot.composition })
      for (const warning of warnings) console.warn(`WARN step ${index}: ${warning}`)
      console.log(`Captured step ${index}: ${resolve(directory, filename)}`)
    }
    await writeFile(resolve(directory, 'diagnostics.json'), `${JSON.stringify(results, null, 2)}\n`)
    console.log(`Inspection artifacts: ${directory}; warnings are advisory, not visual pass/fail evidence`)
    return results
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const slug = args.find((arg) => !arg.startsWith('--'))
  const numberArg = (name, fallback) => Number(args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback))
  inspect({ slug, settleMs: numberArg('settle', SETTLE_MS), width: numberArg('width', 1440), height: numberArg('height', 960) }).catch((error) => { console.error(`FAIL inspection: ${error.message}`); process.exitCode = 1 })
}
