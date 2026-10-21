// Tiny argv parser shared by verify and inspect: `--flag value`, `--flag=value`, bare flags, positionals.
export function parseArgs(argv, { values = [], flags = [] } = {}) {
  const out = { positional: [], values: {}, flags: {} }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      out.positional.push(arg)
      continue
    }
    const [name, inline] = arg.slice(2).split(/=(.*)/s, 2)
    if (flags.includes(name)) {
      out.flags[name] = true
    } else if (values.includes(name)) {
      const value = inline ?? argv[++i]
      if (value === undefined || (inline === undefined && value.startsWith('--'))) {
        throw new Error(`--${name} needs a value`)
      }
      out.values[name] = value
    } else {
      throw new Error(`unknown option --${name}`)
    }
  }
  return out
}

// Per-step wait of the render check; must outlast the kit's layout morph + newcomer entrance.
export const DEFAULT_RENDER_SETTLE_MS = 1000

export function parsePositiveInt(text, name, min = 0) {
  if (!/^\d+$/.test(String(text)) || Number(text) < min) {
    throw new Error(`${name} must be an integer of at least ${min}, got "${text}"`)
  }
  return Number(text)
}

export function parseViewport(text) {
  const match = /^(\d+)x(\d+)$/.exec(text)
  if (!match || Number(match[1]) < 1 || Number(match[2]) < 1) throw new Error(`--viewport must look like 1440x900, got "${text}"`)
  return { width: Number(match[1]), height: Number(match[2]) }
}
