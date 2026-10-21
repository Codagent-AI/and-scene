/** Pure checks used by verify.mjs; kept free of I/O so they can be unit tested. */

/**
 * Confirms the registry holds the mandatory sample (when one is configured) or
 * at least one presentation. Returns the entry to render.
 */
export function selectTarget(registry, sample) {
  if (!sample) {
    if (registry.length === 0) throw new Error('no presentation is registered in src/presentations/index.ts')
    return { slug: registry[0].slug, expected: null }
  }
  const entry = registry.find((e) => e.slug === sample.slug)
  if (!entry) throw new Error(`reference sample "${sample.slug}" is not registered`)
  if (entry.title !== sample.title) {
    throw new Error(`sample title is "${entry.title}", expected "${sample.title}"`)
  }
  return { slug: sample.slug, expected: sample.steps }
}

/** Describes how an observed step differs from the expected one, or returns null. */
export function diffStep(expected, observed) {
  for (const field of ['era', 'title', 'caption']) {
    if (observed[field] !== expected[field]) {
      return `${field} is ${JSON.stringify(observed[field])}, expected ${JSON.stringify(expected[field])}`
    }
  }
  return null
}

/** The step index must advance by exactly one per transition. */
export function checkAdvance(previous, observed) {
  if (observed === previous + 1) return null
  if (observed === previous) return `step index stayed at ${previous}`
  return `step index went from ${previous} to ${observed}, expected ${previous + 1}`
}

export function formatError(kind, step, text) {
  return `${kind} at step ${step}: ${text}`
}
