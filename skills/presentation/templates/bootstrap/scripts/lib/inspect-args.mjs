import path from 'node:path'

export const DEFAULTS = { viewport: { width: 1440, height: 900 }, settleMs: 900, outDir: 'artifacts/inspection' }

/** Parse CLI arguments: `<slug> [--viewport WxH] [--settle-ms N] [--out DIR] [--no-build]`. */
export function parseArgs(argv, root) {
  const options = { slug: undefined, viewport: { ...DEFAULTS.viewport }, settleMs: DEFAULTS.settleMs, outDir: DEFAULTS.outDir, build: true }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = () => {
      const next = argv[++i]
      if (next === undefined) throw new Error(`${arg} needs a value`)
      return next
    }
    if (arg === '--viewport') {
      const match = /^(\d+)x(\d+)$/.exec(value())
      if (!match) throw new Error('--viewport expects WIDTHxHEIGHT, for example 390x844')
      options.viewport = { width: Number(match[1]), height: Number(match[2]) }
    } else if (arg === '--settle-ms') {
      const ms = Number(value())
      if (!Number.isFinite(ms) || ms < 0) throw new Error('--settle-ms expects a non-negative number')
      options.settleMs = ms
    } else if (arg === '--out') {
      options.outDir = value()
    } else if (arg === '--no-build') {
      options.build = false
    } else if (arg.startsWith('--')) {
      throw new Error(`unknown option ${arg}`)
    } else if (options.slug === undefined) {
      options.slug = arg
    } else {
      throw new Error(`unexpected argument ${arg}`)
    }
  }
  if (!options.slug) throw new Error('usage: npm run inspect -- <slug> [--viewport WxH] [--settle-ms N] [--out DIR] [--no-build]')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(options.slug)) throw new Error(`invalid presentation slug "${options.slug}"`)
  const resolved = path.resolve(root, options.outDir)
  const relative = path.relative(root, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('--out must stay inside the project')
  }
  options.outDir = resolved
  return options
}

export function screenshotPath(outDir, slug, index) {
  return path.join(outDir, slug, `step-${String(index + 1).padStart(2, '0')}.png`)
}
