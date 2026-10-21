export const DEFAULTS = { settleMs: 1500, width: 1440, height: 900 }

export function screenshotName(index) {
  return `step-${String(index + 1).padStart(2, '0')}.png`
}

/** Parses `<slug> [--out dir] [--settle ms] [--viewport WxH] [--skip-build]`. */
export function parseArgs(argv) {
  const options = { slug: null, out: null, settleMs: DEFAULTS.settleMs, width: DEFAULTS.width, height: DEFAULTS.height, skipBuild: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--skip-build') options.skipBuild = true
    else if (arg === '--out') options.out = argv[++i]
    else if (arg === '--settle') {
      options.settleMs = Number(argv[++i])
      if (!Number.isFinite(options.settleMs) || options.settleMs < 0) throw new Error('--settle needs a non-negative number of milliseconds')
    } else if (arg === '--viewport') {
      const match = /^(\d+)x(\d+)$/.exec(argv[++i] ?? '')
      if (!match) throw new Error('--viewport needs WIDTHxHEIGHT, for example 1440x900')
      options.width = Number(match[1])
      options.height = Number(match[2])
    } else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`)
    else if (!options.slug) options.slug = arg
    else throw new Error(`unexpected argument ${arg}`)
  }
  if (!options.slug) throw new Error('usage: npm run inspect -- <slug> [--out dir] [--settle ms] [--viewport WxH] [--skip-build]')
  return options
}
