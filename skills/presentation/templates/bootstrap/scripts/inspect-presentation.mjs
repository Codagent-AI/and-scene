#!/usr/bin/env node
// Captures one settled screenshot per step of a registered presentation from a
// production preview on 127.0.0.1, and prints advisory visual warnings.
// Warnings never fail the run; only operational failures exit non-zero.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { runBuild, tail } from './lib/build.mjs'
import { collectSnapshot } from './lib/collect.mjs'
import { diagnose, settle } from './lib/diagnostics.mjs'
import { freePort, HOST, startPreview, waitForReady } from './lib/preview.mjs'

export const DEFAULT_SETTLE_MS = 900
export const DEFAULT_VIEWPORT = { width: 1440, height: 900 }

export class InspectionError extends Error {}

async function build(root) {
  const { code, output } = await runBuild(root)
  if (code !== 0) throw new InspectionError(`npm run build exited with code ${code}\n${tail(output)}`)
}

const realDeps = {
  build,
  freePort,
  startPreview,
  waitForReady,
  launchBrowser: async () => (await import('playwright')).chromium.launch(),
  mkdir: (dir) => mkdir(dir, { recursive: true }),
  writeFile,
  settle,
  log: console.log,
}

export function stepFile(outDir, index) {
  return path.join(outDir, `step-${String(index + 1).padStart(2, '0')}.png`)
}

export async function inspect(options, deps = realDeps) {
  const { root = process.cwd(), slug, settleMs = DEFAULT_SETTLE_MS, viewport = DEFAULT_VIEWPORT, build = true, port } = options
  if (!slug) throw new InspectionError('usage: inspect-presentation <slug> [--settle ms] [--viewport WxH] [--no-build]')
  const custom = viewport.width !== DEFAULT_VIEWPORT.width || viewport.height !== DEFAULT_VIEWPORT.height
  const outDir = options.outDir ?? path.join(root, 'inspection', custom ? `${slug}-${viewport.width}x${viewport.height}` : slug)

  if (build) await deps.build(root)
  let preview
  let browser
  try {
    const p = port ?? (await deps.freePort())
    try {
      preview = await deps.startPreview(root, p)
      await deps.waitForReady(`${preview.origin}/`)
    } catch (err) {
      throw new InspectionError(`could not start the production preview on ${HOST}: ${err.message}`)
    }
    try {
      browser = await deps.launchBrowser()
    } catch (err) {
      throw new InspectionError(`could not launch Chromium: ${err.message}`)
    }
    const page = await browser.newPage({ viewport })
    const url = `${preview.origin}/${slug}`
    try {
      await page.goto(url, { waitUntil: 'load' })
      await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    } catch (err) {
      throw new InspectionError(`route ${url} did not render a presentation: ${err.message}`)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    await deps.mkdir(outDir)

    const report = { slug, url, viewport, settleMs, steps: [], warnings: [] }
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction((n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n), i, { timeout: 4000 })
        } catch {
          throw new InspectionError(`ArrowRight from index ${i - 1} did not advance data-step-index to ${i}; refusing to capture a repeated step`)
        }
      }
      const elapsedMs = await deps.settle(settleMs)
      const snapshot = await page.evaluate(collectSnapshot)
      if (snapshot.index !== i) throw new InspectionError(`expected step index ${i} at capture but the page shows ${snapshot.index}`)
      const file = stepFile(outDir, i)
      try {
        await page.screenshot({ path: file })
      } catch (err) {
        throw new InspectionError(`could not write screenshot ${file}: ${err.message}`)
      }
      const warnings = diagnose(snapshot)
      report.steps.push({ index: i, file, elapsedMs, runningAnimationsAtCapture: snapshot.runningAnimations, warnings: warnings.length })
      report.warnings.push(...warnings)
    }
    await deps.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
    for (const w of report.warnings) deps.log(`WARN ${w}`)
    deps.log(`INSPECT ${slug}: ${count} screenshot(s) in ${outDir}; ${report.warnings.length} advisory warning(s)`)
    return report
  } finally {
    await browser?.close().catch(() => {})
    await preview?.close().catch(() => {})
  }
}

export function parseArgs(argv) {
  const opts = { build: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--no-build') opts.build = false
    else if (a === '--settle') opts.settleMs = Number(argv[++i])
    else if (a === '--port') opts.port = Number(argv[++i])
    else if (a === '--out') opts.outDir = path.resolve(argv[++i])
    else if (a === '--viewport') {
      const [width, height] = argv[++i].split('x').map(Number)
      opts.viewport = { width, height }
    } else if (!a.startsWith('--')) opts.slug = a
  }
  return opts
}

async function main() {
  try {
    await inspect(parseArgs(process.argv.slice(2)))
    process.exit(0)
  } catch (err) {
    console.error(`FAIL [inspect] ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
