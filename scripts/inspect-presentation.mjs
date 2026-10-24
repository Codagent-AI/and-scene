// Capture a settled screenshot of every step of a registered presentation from a
// production preview, and print advisory visual warnings. Usage:
//   npm run inspect -- <slug> [--out <dir>] [--settle <ms>] [--width <px>] [--height <px>] [--no-build]
// Screenshots land in inspection-output/<slug>/step-NN.png (gitignored) with a report.json.
// Warnings are advisory: they never change the exit status.
import { projectRoot } from './lib/config.mjs'
import { DEFAULT_SETTLE_MS } from './lib/capture.mjs'
import { runInspect } from './lib/inspect-core.mjs'

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
  await runInspect({ root: projectRoot, opts: parseArgs(process.argv.slice(2)) })
}

main().catch((err) => {
  console.error(`inspect: FAIL ${err instanceof Error ? err.message : err}`)
  process.exitCode = 1
})
