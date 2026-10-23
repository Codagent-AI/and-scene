/** A verification failure that names the failed phase and, for browser faults, the step. */
export class VerifyError extends Error {
  constructor(phase, message, { step } = {}) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

export const DEFAULT_STEP_TIMEOUT_MS = 5000

export function parseArgs(argv, env = {}) {
  const args = { slug: undefined, timeoutMs: Number(env.VERIFY_STEP_TIMEOUT_MS) || DEFAULT_STEP_TIMEOUT_MS }
  for (const arg of argv) {
    if (arg.startsWith('--timeout=')) args.timeoutMs = Number(arg.slice('--timeout='.length))
    else if (arg.startsWith('-')) throw new VerifyError('arguments', `unknown option ${arg}`)
    else args.slug = arg
  }
  return args
}

const normalize = (text) => String(text).replace(/\s+/g, ' ').trim()
export { normalize }

/** Compares sample step data with the reference outline; returns every mismatch. */
export function compareOutline(actual, expected) {
  const errors = []
  if (normalize(actual.title ?? '') !== normalize(expected.title)) {
    errors.push(`sample title is "${actual.title}", expected "${expected.title}"`)
  }
  const steps = actual.steps ?? []
  if (steps.length !== expected.steps.length) {
    errors.push(`sample has ${steps.length} steps, expected ${expected.steps.length}`)
  }
  expected.steps.forEach((want, i) => {
    const got = steps[i]
    if (!got) return
    for (const field of ['era', 'title', 'caption']) {
      if (normalize(got[field] ?? '') !== normalize(want[field])) {
        errors.push(`step ${i + 1} ${field} is "${got[field]}", expected "${want[field]}"`)
      }
    }
  })
  return errors
}

/**
 * Which routes to render. The sample runs through every step; any other
 * registered presentation renders its first step. A slug limits the run to it.
 */
export function selectRoutes({ registry, sampleSlug, only }) {
  const entries = only ? registry.filter((e) => e.slug === only) : registry
  if (only && entries.length === 0) {
    throw new VerifyError('render', `no registered presentation has slug "${only}"`)
  }
  return entries.map((e) => ({ slug: e.slug, allSteps: e.slug === sampleSlug }))
}

export function formatFailure(error) {
  if (error instanceof VerifyError) {
    const step = error.step === undefined ? '' : ` (step index ${error.step}, step ${error.step + 1})`
    return `VERIFY FAILED: ${error.phase}${step}: ${error.message}`
  }
  return `VERIFY FAILED: internal: ${error instanceof Error ? error.message : String(error)}`
}
