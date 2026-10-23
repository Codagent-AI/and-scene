#!/usr/bin/env node
// Project-local screenshot helper. Captures one settled screenshot per step from a production
// preview and prints advisory visual warnings. Warnings never change the exit code; only a
// crash or setup error exits non-zero.
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { stepWarnings } from './lib/diagnostics.mjs'
import { collectPageDiagnostics } from './lib/collect.mjs'
import { inspectionDirectory, stepFileName } from './lib/paths.mjs'
import { startPreview } from './lib/preview.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  narrow: { width: 390, height: 844 },
}
/** Longest layout morph plus entry delay and entry duration (seconds in constants.ts), with margin. */
export const DEFAULT_SETTLE_MS = 1800

export function parseArguments(argv) {
  const options = { slug: undefined, viewport: 'desktop', settleMs: DEFAULT_SETTLE_MS }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--narrow') options.viewport = 'narrow'
    else if (arg === '--settle') options.settleMs = Number(argv[++i])
    else if (!arg.startsWith('--')) options.slug = arg
    else throw new Error(`unknown option ${arg}`)
  }
  if (!options.slug) throw new Error('usage: npm run inspect -- <slug> [--narrow] [--settle <ms>]')
  if (!Number.isFinite(options.settleMs) || options.settleMs < 0) throw new Error('--settle must be a non-negative number')
  return options
}

/** Builds first so the screenshots always come from the current source. */
function buildOrThrow(root) {
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`npm run build failed before inspection:\n${result.stdout}${result.stderr}`)
}

export async function inspect(argv, { root = ROOT, log = console.log } = {}) {
  const options = parseArguments(argv)
  const outDir = inspectionDirectory(root, options.slug, options.viewport)
  buildOrThrow(root)
  mkdirSync(outDir, { recursive: true })
  const preview = await startPreview(root)
  let browser
  const warnings = []
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: VIEWPORTS[options.viewport] })
    await page.goto(`${preview.url}/${options.slug}`)
    await page.waitForSelector('[data-step-count]', { timeout: 15_000 })
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    log(`inspecting ${options.slug}: ${count} steps at ${options.viewport} viewport -> ${outDir}`)
    for (let index = 0; index < count; index += 1) {
      if (index > 0) await page.keyboard.press('ArrowRight')
      await page.waitForFunction(
        (expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected),
        index,
        { timeout: 5000 },
      )
      await page.waitForTimeout(options.settleMs)
      const diagnostics = await page.evaluate(collectPageDiagnostics)
      await page.screenshot({ path: join(outDir, stepFileName(index)), fullPage: false })
      // Timestamped so a check can confirm each capture waited for the settle interval.
      log(`captured ${stepFileName(index)} at ${Date.now()} ms`)
      warnings.push(...stepWarnings(index + 1, diagnostics))
    }
  } finally {
    if (browser) await browser.close()
    await preview.stop()
  }
  for (const warning of warnings) log(`WARNING ${warning.message}`)
  log(`inspection complete: ${warnings.length} advisory warning(s)`)
  return { warnings, outDir }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  inspect(process.argv.slice(2)).catch((error) => {
    console.error(`INSPECTION ERROR: ${error.message}`)
    process.exitCode = 2
  })
}
