#!/usr/bin/env node
/* global document */
// Captures one settled screenshot per step from a production preview and prints
// advisory visual warnings (overlap, indistinct active chrome, unpolished attribution).
//   node scripts/inspect-presentation.mjs <slug> [--viewport 1440x900] [--settle-ms 1000]
//                                         [--skip-build] [--out <dir>]
// Screenshots go to .inspection/<slug>/ (default viewport) or .inspection/<slug>-<W>x<H>/ (any other viewport).
// Warnings never change the exit code; only a failed capture does.
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { parseArgs, parsePositiveInt, parseViewport } from './lib/args.mjs'
import { CaptureError, DEFAULT_SETTLE_MS, DEFAULT_VIEWPORT, captureSteps, inspectionDirName, parseStepCount } from './lib/capture.mjs'
import { collectPageData } from './lib/collect.mjs'
import { formatWarning } from './lib/diagnostics.mjs'
import { previewFailureMessage, runBuild, startPreview } from './lib/preview.mjs'
import { readRegistrySlugs } from './lib/registry.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const log = (line) => console.log(line)

async function main() {
  const args = parseArgs(process.argv.slice(2), { values: ['viewport', 'settle-ms', 'out'], flags: ['skip-build'] })
  const [slug] = args.positional
  if (!slug) throw new CaptureError('usage: inspect-presentation.mjs <slug> [--viewport WxH] [--settle-ms N] [--skip-build] [--out dir]')
  const viewport = parseViewport(args.values.viewport ?? DEFAULT_VIEWPORT)
  const settleMs = parsePositiveInt(args.values['settle-ms'] ?? DEFAULT_SETTLE_MS, '--settle-ms')
  const outDir = args.values.out ? resolve(args.values.out) : join(ROOT, '.inspection', inspectionDirName(slug, viewport))

  const slugs = await readRegistrySlugs(ROOT)
  if (!slugs.includes(slug)) throw new CaptureError(`unknown presentation "${slug}" (registered: ${slugs.join(', ')})`)

  if (!args.flags['skip-build']) {
    log('[inspect] npm run build')
    await runBuild(ROOT).catch((e) => {
      throw new CaptureError(`build failed\n${String(e.output ?? '').trim().split('\n').slice(-20).join('\n')}`)
    })
  }

  await mkdir(outDir, { recursive: true })
  for (const name of await readdir(outDir)) if (/^step-\d+\.png$/.test(name)) await rm(join(outDir, name))

  const preview = await startPreview(ROOT, { log: (line) => log(`[inspect] ${line}`) }).catch((e) => {
    throw new CaptureError(`preview server failed: ${previewFailureMessage(e)}`)
  })
  let browser
  const warnings = []
  const report = { slug, viewport, settleMs, url: `${preview.url}/${slug}`, steps: [] }
  try {
    browser = await chromium.launch().catch((e) => {
      throw new CaptureError(`could not launch Chromium: ${e.message.split('\n')[0]}`)
    })
    const page = await browser.newPage({ viewport })
    log(`[inspect] open ${report.url}`)
    await page.goto(report.url, { waitUntil: 'load' }).catch((e) => {
      throw new CaptureError(`could not open ${report.url}: ${e.message.split('\n')[0]}`)
    })
    await page.waitForSelector('[data-step-count]', { timeout: 10_000 }).catch(() => {
      throw new CaptureError(`${slug}: no [data-step-count] hook rendered`)
    })
    const count = parseStepCount(await page.getAttribute('[data-step-count]', 'data-step-count'))
    const result = await captureSteps({
      count,
      settleMs,
      driver: {
        now: () => Date.now(),
        wait: (ms) => page.waitForTimeout(ms),
        collect: () => page.evaluate(collectPageData),
        screenshot: (file) => page.screenshot({ path: join(outDir, file) }),
        advance: async (i) => {
          await page.keyboard.press('ArrowRight')
          await page
            .waitForFunction((n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n), i, { timeout: 10_000 })
            .catch(() => {
              throw new CaptureError(`${slug}: transition to step ${i + 1} did not advance`)
            })
        },
        log: (line, found) => {
          for (const w of found) log(formatWarning(w))
          log(`[inspect] ${line}`)
        },
      },
    })
    report.steps = result.steps
    warnings.push(...result.warnings)
  } finally {
    await browser?.close()
    await preview.stop()
  }
  report.warnings = warnings
  await writeFile(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  log(`[inspect] wrote ${report.steps.length} screenshots to ${outDir} (${warnings.length} advisory warnings)`)
}

main().catch((error) => {
  console.error(`[inspect] FAIL ${error instanceof CaptureError ? 'capture: ' : ''}${error.message}`)
  process.exitCode = 1
})
