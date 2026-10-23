// Pure helpers behind scripts/verify.mjs, kept free of browser and process concerns so they unit-test.

/** Source text with `//` and block comments removed; string and template literals are left intact. */
export function stripComments(text) {
  let out = ''
  for (let i = 0; i < text.length; ) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1
      while (j < text.length && text[j] !== ch) j += text[j] === '\\' ? 2 : 1
      out += text.slice(i, j + 1)
      i = j + 1
    } else if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
    } else if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 2
    } else {
      out += ch
      i++
    }
  }
  return out
}

/** Reads `{ slug, title }` entries from the explicit registry source; commented-out entries do not count. */
export function parseRegistry(source) {
  const text = stripComments(source)
  const entries = []
  for (const match of text.matchAll(/slug:\s*(['"])((?:\\.|(?!\1).)*)\1\s*,\s*title:\s*(['"])((?:\\.|(?!\3).)*)\3/g)) {
    entries.push({ slug: match[2], title: match[4].replace(/\\(['"\\])/g, '$1') })
  }
  return entries
}

/** Problems found comparing the rendered/registered sample with the normative outline. */
export function compareSample(expected, actual) {
  const problems = []
  const entry = actual.registry.find((e) => e.slug === expected.slug)
  if (!entry) {
    problems.push(`reference sample "${expected.slug}" is not registered`)
    return problems
  }
  if (actual.registry.filter((e) => e.slug === expected.slug).length > 1) problems.push(`slug "${expected.slug}" is registered more than once`)
  if (entry.title !== expected.title) problems.push(`registered title is "${entry.title}", expected "${expected.title}"`)
  if (actual.steps.length !== expected.steps.length) {
    problems.push(`sample has ${actual.steps.length} steps, expected ${expected.steps.length}`)
  }
  expected.steps.forEach((want, i) => {
    const got = actual.steps[i]
    if (!got) return
    for (const field of ['era', 'title', 'caption']) {
      if (got[field] !== want[field]) problems.push(`step ${i + 1} ${field} is "${got[field]}", expected "${want[field]}"`)
    }
  })
  const titles = actual.steps.map((s) => s.title)
  if (new Set(titles).size !== titles.length) problems.push('sample has duplicate step titles')
  return problems
}

/** Null when the transition moved exactly one step forward, else a description. */
export function checkAdvance(previousIndex, observedIndex) {
  if (observedIndex === previousIndex + 1) return null
  return observedIndex === previousIndex
    ? `step index stayed at ${previousIndex} after advancing (expected ${previousIndex + 1})`
    : `step index went from ${previousIndex} to ${observedIndex} (expected ${previousIndex + 1})`
}

/** Collapses recorded browser errors into one message that names the offending step. */
export function describeErrors(errors) {
  if (errors.length === 0) return null
  const first = errors[0]
  const more = errors.length > 1 ? ` (+${errors.length - 1} more)` : ''
  return { step: first.step, message: `${first.kind}: ${first.text}${more}` }
}

export class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

export function formatFailure(error) {
  const step = error.step === undefined ? '' : ` at step ${error.step + 1} (index ${error.step})`
  return `VERIFY FAIL [${error.phase}]${step}: ${error.message}`
}

/** Whether a rect's centre sits in the bottom-right quadrant of the viewport. */
export function isBottomRight(rect, viewport) {
  return rect.x + rect.width / 2 > viewport.width / 2 && rect.y + rect.height / 2 > viewport.height / 2
}

/** Source of the presentation index: the file in src/presentations declaring `slug` and `load` entries. */
export function findRegistryFile(names, read) {
  const ordered = [...names].filter((f) => /\.(ts|tsx|js|mjs)$/.test(f)).sort((a, b) => (a.startsWith('index.') ? -1 : b.startsWith('index.') ? 1 : 0))
  return ordered.find((f) => /\bslug\b/.test(read(f)) && /\bload\b/.test(read(f))) ?? null
}
