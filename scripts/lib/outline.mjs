/**
 * Pure outline assertions. The verifier compares what the browser observed for each
 * step with the reference outline. Both sides are plain data, so this module is unit-testable.
 */

/** Returns a list of problems. An empty list means the observed steps match the outline exactly. */
export function checkOutline(observed, expected) {
  const problems = []
  if (observed.length !== expected.length) {
    problems.push({ step: null, message: `expected ${expected.length} steps, observed ${observed.length}` })
  }
  const shared = Math.min(observed.length, expected.length)
  for (let index = 0; index < shared; index += 1) {
    const want = expected[index]
    const got = observed[index]
    for (const field of ['era', 'title', 'caption']) {
      if (got[field] !== want[field]) {
        problems.push({
          step: index,
          message: `step ${index + 1} ${field} is ${JSON.stringify(got[field])}, expected ${JSON.stringify(want[field])}`,
        })
      }
    }
  }
  return problems
}

/** Validates the shape of a reference outline before it is used. */
export function validateReference(reference) {
  const problems = []
  if (!reference || typeof reference.slug !== 'string' || reference.slug === '') {
    problems.push('reference slug must be a non-empty string')
  }
  if (!Array.isArray(reference?.steps) || reference.steps.length === 0) {
    problems.push('reference must list at least one step')
    return problems
  }
  reference.steps.forEach((step, index) => {
    for (const field of ['era', 'title', 'caption']) {
      if (typeof step?.[field] !== 'string' || step[field] === '') {
        problems.push(`reference step ${index + 1} is missing ${field}`)
      }
    }
  })
  return problems
}
