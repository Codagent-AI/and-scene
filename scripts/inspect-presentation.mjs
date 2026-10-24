#!/usr/bin/env node
// Captures one settled screenshot per step from a production preview and prints advisory
// visual warnings. Screenshots and warnings are for human review, not pass/fail evidence;
// only runtime/console errors make this command exit non-zero.
// Usage: node scripts/inspect-presentation.mjs <slug> [--out .inspection] [--settle 1500]
//        [--viewport 1280x800] [--narrow] [--no-build] [--root <dir>]
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import {
  DEFAULT_SETTLE_MS,
  captureSequence,
  collectSnapshot,
  screenshotPath,
  stepWarnings,
} from './lib/inspect-diagnostics.mjs'
import { freePort, startPreview, trackErrors, waitForStep } from './lib/preview.mjs'

const HELP = `Usage: npm run inspect -- <slug> [options]

Builds the app (unless --no-build), serves it on 127.0.0.1, and writes one settled screenshot
per step to <out>/<slug>/step-NN.png (<out>/<slug>/narrow/ with --narrow).
Advisory warnings (text/chrome overlap, indistinct active chrome, unpolished attribution) are
printed for review and never change the exit code. Mark an intentional, readable overlap with
data-presentation-allow-overlap. A warning count of zero is not visual approval.

Options:
  --out <dir>        output directory (default .inspection)
  --settle <ms>      wait after each step before capturing (default ${DEFAULT_SETTLE_MS})
  --viewport WxH     desktop viewport (default 1280x800)
  --narrow           also capture a 390x844 pass
  --no-build         reuse the existing dist/
  --root <dir>       project root (default: parent of scripts/)`

const argv = process.argv.slice(2)
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(HELP)
  process.exit(0)
}
const option = (name, fallback) => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : fallback
}
const slug = argv.find((a, i) => !a.startsWith('--') && !['--out', '--settle', '--viewport', '--root'].includes(argv[i - 1]))
if (!slug) {
  console.error(HELP)
  process.exit(2)
}
const root = path.resolve(option('--root', path.join(path.dirname(fileURLToPath(import.meta.url)), '..')))
const outDir = path.resolve(root, option('--out', '.inspection'))
const settleMs = Number(option('--settle', DEFAULT_SETTLE_MS))
const [vw, vh] = option('--viewport', '1280x800').split('x').map(Number)

async function capturePass(browser, baseUrl, viewport, variant) {
  const page = await browser.newPage({ viewport })
  const errors = trackErrors(page)
  await page.goto(`${baseUrl}/${slug}`)
  try {
    await page.waitForSelector('[data-step-count]', { timeout: 10000 })
  } catch {
    errors.push(`no presentation rendered at /${slug}`)
    return { warnings: [], errors, shots: 0 }
  }
  const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
  const warnings = []
  let shots = 0
  await captureSequence({
    count,
    settleMs,
    sleep: (ms) => page.waitForTimeout(ms),
    advance: async (i) => {
      if (i === 0) return
      await page.keyboard.press('ArrowRight')
      if (!(await waitForStep(page, i))) errors.push(`step ${i + 1}: the step index did not advance`)
    },
    capture: async (i) => {
      const file = screenshotPath(outDir, slug, i, variant)
      mkdirSync(path.dirname(file), { recursive: true })
      await page.screenshot({ path: file })
      shots++
      warnings.push(...stepWarnings(i + 1, await page.evaluate(collectSnapshot)))
      if (errors.length) console.error(`ERROR step ${i + 1}: ${errors.join('; ')}`)
    },
  })
  await page.close()
  return { warnings, errors, shots, count }
}

async function main() {
  if (!argv.includes('--no-build')) {
    const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
    if (build.status !== 0) throw new Error('npm run build failed')
  }
  const preview = await startPreview(root, await freePort())
  let browser
  try {
    browser = await chromium.launch()
    const passes = [{ viewport: { width: vw, height: vh }, variant: undefined }]
    if (argv.includes('--narrow')) passes.push({ viewport: { width: 390, height: 844 }, variant: 'narrow' })
    let warningCount = 0
    let failed = false
    for (const pass of passes) {
      const result = await capturePass(browser, preview.url, pass.viewport, pass.variant)
      for (const line of result.warnings) console.log(line)
      for (const error of result.errors) console.error(`ERROR ${error}`)
      warningCount += result.warnings.length
      failed ||= result.errors.length > 0
      console.log(`inspect: ${result.shots} screenshots for /${slug} (${pass.viewport.width}x${pass.viewport.height}) in ${path.relative(root, outDir) || '.'}`)
    }
    console.log(`inspect: ${warningCount} advisory warning(s); review the screenshots, warnings are not approval`)
    process.exitCode = failed ? 1 : 0
  } finally {
    await browser?.close().catch(() => {})
    await preview.stop()
  }
}

main().catch((error) => {
  console.error(`inspect failed: ${error.message}`)
  process.exit(1)
})
