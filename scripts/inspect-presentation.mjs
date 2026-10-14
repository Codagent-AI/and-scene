#!/usr/bin/env node
// Capture settled per-step screenshots of a presentation from a production preview
// and print advisory (never fatal) visual-quality warnings.
//
//   npm run inspect -- <slug> [--settle <ms>] [--viewport WxH] [--out <dir>]
//                              [--skip-build] [--dist <dir>]
//
// By default the script runs `npm run build` first so screenshots reflect the
// current source; `--skip-build` reuses an existing build (`--dist` selects its dir).
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { collectSnapshot, warningsForSnapshot } from './lib/diagnostics.mjs'
import { HOST, launchChromium, projectRoot, runCommand, startPreview } from './lib/preview.mjs'

export const DEFAULT_SETTLE_MS = 1200 // longer than kit enter delay + enter duration
export const DEFAULT_VIEWPORT = { width: 1440, height: 900 }

export function parseArgs(argv) {
  const opts = { slug: undefined, settle: DEFAULT_SETTLE_MS, viewport: DEFAULT_VIEWPORT, out: undefined, build: true, dist: undefined }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--viewport') {
      const m = /^(\d+)x(\d+)$/.exec(argv[++i] ?? '')
      if (!m) throw new Error('--viewport expects WxH, e.g. 390x844')
      opts.viewport = { width: Number(m[1]), height: Number(m[2]) }
    } else if (a === '--out') opts.out = argv[++i]
    else if (a === '--dist') opts.dist = argv[++i]
    else if (a === '--skip-build') opts.build = false
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`)
    else opts.slug = a
  }
  if (!opts.slug) throw new Error('usage: npm run inspect -- <slug> [--settle <ms>] [--viewport WxH] [--out <dir>] [--skip-build] [--dist <dir>]')
  if (!Number.isFinite(opts.settle) || opts.settle < 0) throw new Error('--settle expects milliseconds')
  return opts
}

export const stepFileName = (index) => `step-${String(index + 1).padStart(2, '0')}.png`

export async function inspect(opts, root = projectRoot()) {
  if (opts.build) {
    const { code, output } = await runCommand('npm', ['run', 'build'], { cwd: root })
    if (code !== 0) throw new Error(`build failed (exit ${code})\n${output.trim()}`)
  }
  const outDir = path.resolve(root, opts.out ?? path.join('artifacts', 'inspection', opts.slug))
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })

  const warnings = []
  const manifest = { slug: opts.slug, viewport: opts.viewport, settleMs: opts.settle, steps: [] }
  const preview = await startPreview(root, { outDir: opts.dist })
  let browser
  try {
    browser = await launchChromium()
    const page = await browser.newPage({ viewport: opts.viewport })
    await page.goto(`http://${HOST}:${preview.port}/${opts.slug}`)
    await page.waitForSelector('[data-presentation-root]', { timeout: 10_000 })
    const root$ = page.locator('[data-presentation-root]')
    const count = Number(await root$.getAttribute('data-step-count'))
    for (let i = 0; i < count; i++) {
      const advancedAt = Date.now()
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
          i,
          { timeout: 5000 },
        )
      }
      await page.waitForTimeout(opts.settle)
      const stepIndex = Number(await root$.getAttribute('data-step-index'))
      const file = stepFileName(i)
      await page.screenshot({ path: path.join(outDir, file) })
      manifest.steps.push({ step: i + 1, file, stepIndex, advancedAt, capturedAt: Date.now() })
      warnings.push(...warningsForSnapshot(i + 1, await page.evaluate(collectSnapshot)))
    }
  } finally {
    await browser?.close().catch(() => {})
    await preview.stop()
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  return { outDir, manifest, warnings }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { outDir, manifest, warnings } = await inspect(parseArgs(process.argv.slice(2)))
    for (const w of warnings) console.log(w)
    console.log(`Captured ${manifest.steps.length} settled screenshots in ${outDir}`)
    console.log(warnings.length ? `${warnings.length} advisory warning(s); these do not affect the exit code.` : 'No advisory warnings.')
  } catch (err) {
    console.error(`inspect failed: ${err.message}`)
    process.exit(1)
  }
}
