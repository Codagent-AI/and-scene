/**
 * Compares the sample's registry entry and step data with the normative outline.
 * Returns human-readable problems; an empty array means the sample matches.
 */
export function checkOutline({ registry, slug, steps, expected }) {
  const problems = []
  if (!registry.some((entry) => entry.slug === slug)) {
    return [{ message: `no registry entry for slug "${slug}"` }]
  }
  if (steps.length !== expected.length) {
    return [{ message: `expected ${expected.length} steps, found ${steps.length}` }]
  }
  expected.forEach((want, index) => {
    const got = steps[index]
    for (const field of ['era', 'title', 'caption']) {
      if (got[field] !== want[field]) {
        problems.push({
          step: index,
          message: `step ${index} ${field} is ${JSON.stringify(got[field])}, expected ${JSON.stringify(want[field])}`,
        })
      }
    }
  })
  return problems
}
