/** A verification failure that names its phase (build, sample, render) and, when known, the step index. */
export class VerifyError extends Error {
  /**
   * @param {string} phase
   * @param {string} message
   * @param {number | null} [step]
   */
  constructor(phase, message, step = null) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

export function formatFailure(err) {
  if (err instanceof VerifyError) {
    const where = err.step === null ? '' : ` (step index ${err.step})`
    return `FAIL ${err.phase}${where}: ${err.message}`
  }
  return `FAIL verify: ${err instanceof Error ? err.message : String(err)}`
}

/** Sample phase: the reference sample is registered, titled correctly and loadable. */
export function validateRegistry(entries, { slug, title }, loaderOk = () => true) {
  const entry = entries.find((e) => e.slug === slug)
  if (!entry) throw new VerifyError('sample', `reference sample "${slug}" is not registered in src/presentations/index.ts`)
  if (entry.title !== title) throw new VerifyError('sample', `registry title "${entry.title}" does not match "${title}"`)
  if (!loaderOk(entry.loader)) throw new VerifyError('sample', `loader "${entry.loader}" for "${slug}" does not resolve to a file`)
  return entry
}

/** Sample phase: the rendered step matches the normative outline at that position. */
export function validateSampleStep(index, rendered, outline) {
  const expected = outline[index]
  if (!expected) throw new VerifyError('sample', `unexpected step ${index}; the sample has ${outline.length} steps`, index)
  for (const field of ['title', 'caption', 'presentTitle']) {
    const want = field === 'presentTitle' ? expected.title : expected[field]
    if (rendered[field] !== want) {
      throw new VerifyError('sample', `${field} is ${JSON.stringify(rendered[field])}, expected ${JSON.stringify(want)}`, index)
    }
  }
}

export function validateStepCount(count, outline) {
  if (count !== outline.length) throw new VerifyError('sample', `sample renders ${count} steps, expected ${outline.length}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Render phase: waits for the public step index to become `expected`; anything else fails at `from`. */
export async function waitForIndex(read, expected, { from = expected, timeoutMs = 5000, pollMs = 50 } = {}) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const value = await read()
    if (value === expected) return
    if (value !== null && value !== from) {
      throw new VerifyError('render', `step index became ${value}, expected ${expected}`, expected)
    }
    if (Date.now() >= deadline) {
      throw new VerifyError('render', `step index stayed ${value} for ${timeoutMs}ms, expected ${expected}`, expected)
    }
    await sleep(pollMs)
  }
}

/** Records console errors and uncaught page errors against the step being rendered. */
export function collectBrowserErrors(page, getStep) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ step: getStep(), text: `console.error: ${msg.text()}` })
  })
  page.on('pageerror', (err) => errors.push({ step: getStep(), text: `uncaught page error: ${err.message ?? err}` }))
  return {
    errors,
    check() {
      const first = errors[0]
      if (first) throw new VerifyError('render', first.text, first.step)
    },
  }
}
