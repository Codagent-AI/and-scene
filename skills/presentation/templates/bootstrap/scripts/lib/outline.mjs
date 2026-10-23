/**
 * Compare a presentation's steps to the expected outline (era, title, caption),
 * in order. Returns a list of problems; empty means it matches.
 */
export function compareOutline(steps, expected) {
  const problems = []
  if (!Array.isArray(steps)) return ['steps are not an array']
  if (steps.length !== expected.length) {
    problems.push(`expected ${expected.length} steps, found ${steps.length}`)
  }
  expected.forEach((want, i) => {
    const got = steps[i]
    if (!got) {
      problems.push(`step ${i + 1} is missing`)
      return
    }
    for (const field of ['era', 'title', 'caption']) {
      if (got[field] !== want[field]) {
        problems.push(`step ${i + 1} ${field}: expected ${JSON.stringify(want[field])}, found ${JSON.stringify(got[field])}`)
      }
    }
  })
  return problems
}

/** Check the registry for the reference presentation. */
export function checkRegistration(registry, reference) {
  const entry = registry.find((e) => e.slug === reference.slug)
  if (!entry) return [`reference presentation "${reference.slug}" is not registered`]
  const problems = []
  if (reference.title && entry.title !== reference.title) {
    problems.push(`registered title ${JSON.stringify(entry.title)} should be ${JSON.stringify(reference.title)}`)
  }
  if (typeof entry.load !== 'function') problems.push(`registry entry "${reference.slug}" has no loader`)
  return problems
}
