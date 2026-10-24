/** A failed verification phase, optionally tied to one step (zero-based index). */
export class VerifyError extends Error {
  constructor(phase, message, { step } = {}) {
    super(message)
    this.name = 'VerifyError'
    this.phase = phase
    this.step = step
  }
}

export function formatFailure(err) {
  if (err instanceof VerifyError) {
    const where = err.step === undefined ? err.phase : `${err.phase}, step index ${err.step}`
    return `verify: FAIL [${where}] ${err.message}`
  }
  return `verify: FAIL [unexpected] ${err instanceof Error ? err.message : String(err)}`
}

export const formatPass = (routes) =>
  `verify: PASS (build ok; ${routes.map((r) => `${r.slug}: ${r.count} steps`).join(', ')})`
