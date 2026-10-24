// Capture a settled screenshot of every step of a registered presentation from a
// production preview, and print advisory visual warnings. Usage:
//   npm run inspect -- <slug> [--out <dir>] [--settle <ms>] [--width <px>] [--height <px>] [--no-build]
// Screenshots land in inspection-output/<slug>/step-NN.png (gitignored) with a report.json.
// Warnings are advisory: they never change the exit status.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { projectRoot } from './lib/config.mjs'
import { DEFAULT_SETTLE_MS, captureSteps } from './lib/capture.mjs'
import { analyzeSnapshot, extractSnapshot } from './lib/diagnostics.mjs'
import { runBuild, startPreview } from './lib/preview.mjs'
import { collectErrors, waitForIndex } from './lib/step-driver.mjs'

function parseArgs(argv) {
  const opts = { slug: undefined, out: undefined, settle: DEFAULT_SETTLE_MS, width: 1440, height: 900, build: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') opts.out = argv[++i]
    else if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--width') opts.width = Number(argv[++i])
    else if (a === '--height') opts.height = Number(argv[++i])
    else if (a === '--no-build') opts.build = false
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`)
    else opts.slug = a
  }
  if (!opts.slug) throw new Error('usage: npm run inspect -- <slug> [--out dir] [--settle ms] [--width px] [--height px] [--no-build]')
  return opts
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const outDir = path.resolve(projectRoot, opts.out ?? path.join('inspection-output', opts.slug))
  if (opts.build) {
    const build = await runBuild(projectRoot)
    if (!build.ok) throw new Error(`npm run build failed:\n${build.output}`)
  }
  const preview = await startPreview(projectRoot)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height } })
    const errors = collectErrors(page, () => 0)
    await page.goto(`${preview.origin}/${opts.slug}`)
    const hooks = await waitForIndex(page, 0, { timeoutMs: 10_000 })
    if (!hooks || !(hooks.count > 0)) throw new Error(`no presentation found at /${opts.slug} (is it registered?)`)
    await mkdir(outDir, { recursive: true })
    const records = await captureSteps({
      page,
      count: hooks.count,
      outDir,
      settleMs: opts.settle,
      shoot: (file) => page.screenshot({ path: file }),
      snapshot: () => page.evaluate(extractSnapshot),
    })
    const warnings = records.flatMap((r) => analyzeSnapshot(r.index + 1, r.snapshot))
    for (const w of warnings) console.log(`warning: step ${w.step} ${w.kind}: ${w.message}`)
    for (const e of errors) console.log(`browser error: ${e.text}`)
    await writeFile(
      path.join(outDir, 'report.json'),
      JSON.stringify({ slug: opts.slug, viewport: { width: opts.width, height: opts.height }, steps: records.map((r) => ({ index: r.index, file: r.file, settleMs: r.settleMs, waitedMs: r.waitedMs })), warnings, errors }, null, 2),
    )
    console.log(`inspect: ${records.length} screenshots in ${path.relative(projectRoot, outDir)}; ${warnings.length} advisory warning(s)`)
  } finally {
    await browser.close()
    await preview.stop()
  }
}

main().catch((err) => {
  console.error(`inspect: FAIL ${err instanceof Error ? err.message : err}`)
  process.exitCode = 1
})
