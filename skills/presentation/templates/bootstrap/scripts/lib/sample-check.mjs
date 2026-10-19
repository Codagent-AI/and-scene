// Pure comparisons between the normative expectation and what was found.

export const checkSample = {
  /** The expected slug and title are registered. */
  registered(expected, registry) {
    const entry = registry.find((candidate) => candidate.slug === expected.slug)
    if (!entry) return `reference presentation "${expected.slug}" is not registered in src/presentations/index.ts`
    if (entry.title !== expected.title) {
      return `registered title "${entry.title}" does not match "${expected.title}"`
    }
    return null
  },
  count(expected, count) {
    return count === expected.steps.length
      ? null
      : `expected ${expected.steps.length} steps but the presentation reports ${count}`
  },
  step(expected, index, actual) {
    const want = expected.steps[index]
    if (!want) return `unexpected extra step ${index + 1}`
    for (const field of ['era', 'title', 'caption']) {
      if (actual[field] !== want[field]) {
        return `${field} is "${actual[field]}" but should be "${want[field]}"`
      }
    }
    return null
  },
}
