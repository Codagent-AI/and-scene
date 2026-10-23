#!/usr/bin/env node
// Capture settled per-step screenshots of a registered presentation from a
// production preview and print advisory visual warnings. Warnings never change
// the exit status; only build, browser or capture failures do.
//
//   npm run inspect -- <slug> [--narrow] [--settle=<ms>] [--no-build]
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import {
  activeChromeWarnings,
  attributionWarnings,
  DEFAULT_SETTLE_MS,
  formatWarning,
  inspectExitCode,
  overlapWarnings,
  stepFileName,
} from './lib/diagnostics.mjs'
import { startPreview } from './lib/preview.mjs'
import { snapshotPage } from './lib/page-snapshot.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const VIEWPORTS = { desktop: { width: 1280, height: 720 }, narrow: { width: 390, height: 844 } }

function parse(argv) {
  const args = { slug: undefined, narrow: false, settleMs: DEFAULT_SETTLE_MS, build: true }
  for (const arg of argv) {
    if (arg === '--narrow') args.narrow = true
    else if (arg === '--no-build') args.build = false
    else if (arg.startsWith('--settle=')) args.settleMs = Number(arg.slice('--settle='.length))
    else if (arg.startsWith('-')) throw new Error(`unknown option ${arg}`)
    else args.slug = arg
  }
  if (!args.slug) throw new Error('usage: npm run inspect -- <slug> [--narrow] [--settle=<ms>] [--no-build]')
  return args
}

async function main() {
  const args = parse(process.argv.slice(2))
  if (args.build) {
    const built = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8' })
    if (built.status !== 0) {
      process.stdout.write(`${built.stdout}${built.stderr}`)
      throw new Error('npm run build failed')
    }
  }
  const outDir = path.join(root, 'inspection', args.slug + (args.narrow ? '-narrow' : ''))
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })
  const preview = await startPreview(root)
  let browser
  const warnings = []
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: args.narrow ? VIEWPORTS.narrow : VIEWPORTS.desktop })
    await page.goto(preview.url(`/${args.slug}`), { waitUntil: 'load' })
    await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    const count = await page.evaluate(() => Number(document.querySelector('[data-step-count]').getAttribute('data-step-count')))
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((n) => document.querySelector('[data-step-count]').getAttribute('data-step-index') === String(n), i, { timeout: 10000 })
      }
      await page.waitForTimeout(args.settleMs)
      await page.screenshot({ path: path.join(outDir, stepFileName(i)) })
      const snap = await page.evaluate(snapshotPage)
      warnings.push(
        ...overlapWarnings(snap.items, i),
        ...activeChromeWarnings(snap.chrome, i),
        ...attributionWarnings(snap.attribution, i),
      )
    }
    console.log(`captured ${count} screenshots in ${path.relative(root, outDir)}`)
  } finally {
    await browser?.close().catch(() => {})
    await preview.stop()
  }
  for (const w of warnings) console.log(formatWarning(w))
  console.log(`${warnings.length} advisory warning(s)`)
  return inspectExitCode({ failure: false })
}

main().then(
  (code) => {
    process.exitCode = code
  },
  (error) => {
    console.error(`inspect failed: ${error.message}`)
    process.exitCode = inspectExitCode({ failure: true })
  },
)
