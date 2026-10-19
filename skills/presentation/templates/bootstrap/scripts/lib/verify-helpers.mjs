// Pure helpers for scripts/verify.mjs (kept free of side effects so they can be unit tested).
import net from 'node:net'

export const HOST = '127.0.0.1'
export const PHASES = ['build', 'sample-registration', 'render', 'transition']

/** A verification failure that names the phase (and, for browser phases, the zero-based step). */
export class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.name = 'VerifyError'
    this.phase = phase
    this.step = step
  }
}

export function formatFailure(err) {
  if (err instanceof VerifyError) {
    const step = err.step === undefined ? '' : ` step=${err.step}`
    return `[verify] FAIL phase=${err.phase}${step} ${err.message}`
  }
  return `[verify] FAIL phase=unknown ${err instanceof Error ? err.message : String(err)}`
}

function stripComments(text) {
  // Strings are matched first so comment markers inside them are preserved.
  return text.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1|\/\/.*$|\/\*[\s\S]*?\*\//gm, (m) => (m[0] === '/' ? ' ' : m))
}

/** Extract `{ slug, title }` entries from the text of src/presentations/index.ts. */
export function parseRegistry(text) {
  const entries = []
  const source = stripComments(text)
  const re = /slug\s*:\s*(['"`])((?:(?!\1).)*)\1(?:[^{}]*?title\s*:\s*(['"`])((?:(?!\3).)*)\3)?/g
  let m
  while ((m = re.exec(source)) !== null) {
    entries.push({ slug: m[2], title: m[4] })
  }
  return entries
}

/** Parse and validate the reference JSON. Throws VerifyError(sample-registration) when malformed. */
export function parseReference(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch (err) {
    throw new VerifyError('sample-registration', `reference file is not valid JSON: ${err.message}`)
  }
  const bad = (why) => {
    throw new VerifyError('sample-registration', `reference file is malformed: ${why}`)
  }
  if (!data || typeof data !== 'object') bad('expected an object')
  if (typeof data.slug !== 'string' || !data.slug) bad('missing "slug"')
  if (typeof data.presentationTitle !== 'string' || !data.presentationTitle) bad('missing "presentationTitle"')
  if (!Array.isArray(data.steps) || data.steps.length === 0) bad('"steps" must be a non-empty array')
  data.steps.forEach((s, i) => {
    for (const k of ['era', 'title', 'caption']) {
      if (!s || typeof s[k] !== 'string') bad(`steps[${i}].${k} must be a string`)
    }
  })
  return data
}

/** Registry must contain the sample slug (with the reference presentation title when present). */
export function checkSampleRegistered(registry, reference) {
  const entry = registry.find((e) => e.slug === reference.slug)
  if (!entry) {
    throw new VerifyError(
      'sample-registration',
      `reference sample "${reference.slug}" is not registered in src/presentations/index.ts`,
    )
  }
  if (entry.title !== undefined && entry.title !== reference.presentationTitle) {
    throw new VerifyError(
      'sample-registration',
      `registry title for "${reference.slug}" is ${JSON.stringify(entry.title)}, expected ${JSON.stringify(reference.presentationTitle)}`,
    )
  }
}

/** Reference mode when a reference file exists beside the script, otherwise scaffold-local mode. */
export function selectMode(referenceExists) {
  return referenceExists ? 'reference' : 'scaffold-local'
}

/** Scaffold-local mode needs at least one registered presentation. */
export function slugsToVisit(registry) {
  const slugs = [...new Set(registry.map((e) => e.slug))]
  if (slugs.length === 0) {
    throw new VerifyError('sample-registration', 'no presentations are registered in src/presentations/index.ts; nothing to render')
  }
  return slugs
}

/** Compare one observed step against its reference row; returns mismatch descriptions. */
export function compareStep(expected, observed) {
  const out = []
  for (const k of ['era', 'title', 'caption']) {
    if (observed[k] === undefined) continue
    if (observed[k] !== expected[k]) {
      out.push(`${k} is ${JSON.stringify(observed[k])}, expected ${JSON.stringify(expected[k])}`)
    }
  }
  return out
}

export function findFreePort(host = HOST) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.once('error', reject)
    server.listen(0, host, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}
