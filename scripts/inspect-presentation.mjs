// Captures settled per-step screenshots of a presentation from a production
// preview and prints advisory visual warnings. Warnings never change the exit
// code: this is an inspection aid, not a gate.
//
//   npm run inspect -- <slug> [--out <dir>] [--settle <ms>] [--viewport WxH] [--no-build]
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ATTRIBUTION_HINT, findAttributionIssues, findIndistinctActive, findOverlaps } from './lib/diagnostics.mjs'
import { launchBrowser, sleep, startPreview } from './lib/preview.mjs'
import { settleThenCapture } from './lib/settle.mjs'
import { collectSnapshot } from './lib/snapshot.mjs'

const root = path.resolve(import.meta.dirname, '..')

function parseArgs(argv) {
  const opts = { slug: null, out: null, settle: 900, viewport: '1280x720', build: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') opts.out = argv[++i]
    else if (a === '--settle') opts.settle = Number(argv[++i])
    else if (a === '--viewport') opts.viewport = argv[++i]
    else if (a === '--no-build') opts.build = false
    else if (!a.startsWith('--') && !opts.slug) opts.slug = a
    else throw new Error(`unknown argument: ${a}`)
  }
  if (!opts.slug) throw new Error('usage: inspect-presentation <slug> [--out dir] [--settle ms] [--viewport WxH] [--no-build]')
  if (!/^\d+x\d+$/.test(opts.viewport)) throw new Error(`invalid viewport: ${opts.viewport}`)
  return opts
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const [width, height] = opts.viewport.split('x').map(Number)
  const outDir = path.resolve(root, opts.out ?? path.join('.inspection', opts.slug, opts.viewport))
  fs.mkdirSync(outDir, { recursive: true })

  if (opts.build) {
    const res = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8' })
    if (res.status !== 0) {
      process.stderr.write(`${res.stdout}${res.stderr}`)
      throw new Error('build failed')
    }
  }

  const server = await startPreview(root)
  const browser = await launchBrowser()
  const report = { slug: opts.slug, viewport: opts.viewport, settleMs: opts.settle, steps: [], warnings: [] }
  const warn = (step, text) => {
    report.warnings.push({ step, text })
    console.log(`WARN step ${step}: ${text}`)
  }
  try {
    const page = await browser.newPage({ viewport: { width, height } })
    const res = await page.goto(`${server.url}/${opts.slug}`, { waitUntil: 'load' })
    if (!res?.ok()) throw new Error(`/${opts.slug} responded ${res?.status()}`)
    await page.waitForSelector('[data-presentation-root]')
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))

    for (let i = 0; i < count; i++) {
      const navigatedAt = Date.now()
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
          i,
        )
      }
      const file = path.join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      let capturedAfterMs = 0
      await settleThenCapture({
        settleMs: opts.settle,
        sleep,
        capture: async () => {
          capturedAfterMs = Date.now() - navigatedAt
          await page.screenshot({ path: file })
        },
      })
      report.steps.push({ step: i + 1, file: path.relative(root, file), capturedAfterMs })

      const snap = await page.evaluate(collectSnapshot)
      for (const o of findOverlaps(snap.elements)) {
        warn(i + 1, `overlap between ${o.a} and ${o.b}; fix it or mark the subtree data-presentation-allow-overlap if intentional`)
      }
      for (const g of findIndistinctActive(snap.groups)) {
        warn(i + 1, `active ${g.chrome} is visually indistinct from inactive ones; style [data-presentation-active="true"] / [aria-current]`)
      }
      if (i === 0) {
        for (const issue of findAttributionIssues(snap.attribution)) warn(1, `${issue}; ${ATTRIBUTION_HINT}`)
      }
    }
  } finally {
    await browser.close()
    await server.close()
  }

  fs.writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(`[inspect] ${report.steps.length} screenshots in ${path.relative(root, outDir)}`)
  console.log(`[inspect] ${report.warnings.length} advisory warning(s)`)
}

main().catch((err) => {
  console.error(`[inspect] ${err instanceof Error ? err.message : err}`)
  process.exitCode = 1
})
