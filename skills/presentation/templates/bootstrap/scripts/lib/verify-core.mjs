// Pure helpers behind scripts/verify.mjs, kept free of browser and process concerns so they unit-test.

const REGEX_KEYWORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await'])

/** Source text with `//` and block comments removed; string, template and regex literals are left intact. */
export function stripComments(text) {
  let out = ''
  let last = '' // last significant character emitted, to tell a regex literal from a division
  let beforeLast = ''
  let word = ''
  const emit = (chunk) => {
    out += chunk
    const trimmed = chunk.trimEnd()
    if (!trimmed) return
    beforeLast = trimmed.length > 1 ? trimmed.at(-2) : last
    last = trimmed.at(-1)
    word = /[\w$]$/.test(trimmed) ? (trimmed.match(/[\w$]+$/)?.[0] ?? '') : ''
  }
  for (let i = 0; i < text.length; ) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1
      while (j < text.length && text[j] !== ch) j += text[j] === '\\' ? 2 : 1
      emit(text.slice(i, j + 1))
      i = j + 1
    } else if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
    } else if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 2
    } else if (ch === '/' && (last === '' || (/[(,=:[!&|?{;+\-*%~^]/.test(last) && !(beforeLast === last && /[+-]/.test(last))) || REGEX_KEYWORDS.has(word))) {
      let j = i + 1
      let inClass = false
      while (j < text.length && text[j] !== '\n' && (inClass || text[j] !== '/')) {
        if (text[j] === '\\') j++
        else if (text[j] === '[') inClass = true
        else if (text[j] === ']') inClass = false
        j++
      }
      if (text[j] !== '/') {
        // no closing slash on this line: it was a division, not a regex literal
        emit('/')
        i++
        continue
      }
      j++
      while (j < text.length && /[a-z]/i.test(text[j])) j++
      emit(text.slice(i, j))
      i = j
    } else {
      emit(ch)
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
