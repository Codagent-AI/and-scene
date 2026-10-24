export class VerifyFailure extends Error {
  constructor(phase, message, { slug, step, index, total } = {}) {
    super(message)
    this.phase = phase
    this.slug = slug
    this.step = step
    this.index = index
    this.total = total
  }
}

export const normalize = (text) => (text ?? '').replace(/\s+/g, ' ').trim()

/** Reads `{ slug, title }` pairs from the explicit presentation registry, whatever the property order. */
export function parseRegistry(source) {
  const entries = []
  const property = (body, name) => new RegExp(`\\b${name}\\s*:\\s*(['"\`])([^]*?)\\1`).exec(body)?.[2]
  for (const [, body] of source.matchAll(/\{([^{}]*)\}/g)) {
    const slug = property(body, 'slug')
    const title = property(body, 'title')
    if (slug !== undefined && title !== undefined) entries.push({ slug, title })
  }
  return entries
}

/** Required presentation first, then every other registered one. Throws when it is missing. */
export function planRoutes(registered, requiredSlug) {
  const slugs = registered.map((entry) => entry.slug)
  if (requiredSlug && !slugs.includes(requiredSlug)) {
    throw new VerifyFailure('sample', `reference presentation "${requiredSlug}" is not registered in src/presentations/index.ts`)
  }
  return requiredSlug ? [requiredSlug, ...slugs.filter((slug) => slug !== requiredSlug)] : slugs
}

/** Compares the rendered narration with the normative outline, in order. */
export function checkOutline(observed, expected) {
  const problems = []
  if (observed.length !== expected.length) {
    problems.push(`expected ${expected.length} steps but found ${observed.length}`)
  }
  expected.forEach((want, i) => {
    const got = observed[i]
    if (!got) return
    for (const field of ['era', 'title', 'caption']) {
      if (normalize(got[field]) !== normalize(want[field])) {
        problems.push(`step ${i + 1} ${field}: expected "${normalize(want[field])}" but found "${normalize(got[field])}"`)
      }
    }
  })
  return problems
}

/** A transition is valid only when it lands exactly on the next index. */
export function isAdvance(previousIndex, nextIndex) {
  return nextIndex === previousIndex + 1
}

/** Collects console errors, uncaught page errors and failed requests with the current step label. */
export function createErrorCollector(page) {
  const errors = []
  let label = 'initial load'
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error during ${label}: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`uncaught error during ${label}: ${error.message}`))
  page.on('requestfailed', (request) => {
    errors.push(`request failed during ${label}: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`)
  })
  return {
    setLabel: (next) => (label = next),
    drain: () => errors.splice(0, errors.length),
  }
}

const readIndex = (page) => page.evaluate(() => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')))

const readNarration = (page) =>
  page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent ?? null
    return {
      era: text('[data-presentation-marker-era]'),
      title: text('[data-presentation-title]'),
      caption: text('[data-presentation-caption]'),
    }
  })

/** Steps through one presentation route; resolves with the narration seen at each step. */
export async function renderPresentation(page, url, slug, { stepTimeoutMs = 5000, settleMs = 300 } = {}) {
  const collector = createErrorCollector(page)
  let at = { index: 0, total: undefined }
  const fail = (message, index = at.index, total = at.total) =>
    new VerifyFailure('render', message, { slug, step: index + 1, index, total })
  const failIfErrors = () => {
    const errors = collector.drain()
    if (errors.length) throw fail(errors.join('; '))
  }

  try {
    await page.goto(`${url}/${slug}`, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-count]', { timeout: stepTimeoutMs })
    } catch {
      failIfErrors()
      throw fail(`/${slug} did not render a presentation (no data-step-count hook)`)
    }
    const total = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    at = { index: 0, total }
    if (!(total > 0)) throw fail('presentation reports no steps')
    const initial = await readIndex(page)
    if (initial !== 0) throw fail(`opened on step index ${initial} instead of 0`)

    const seen = []
    for (let index = 0; index < total; index++) {
      at = { index, total }
      collector.setLabel(`step ${index + 1} of ${total}`)
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (want) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === want,
            index,
            { timeout: stepTimeoutMs },
          )
        } catch {
          failIfErrors()
          const actual = await readIndex(page)
          throw fail(`ArrowRight did not advance to index ${index} (stayed at ${actual})`)
        }
        const actual = await readIndex(page)
        if (!isAdvance(index - 1, actual)) throw fail(`transition landed on index ${actual}, expected ${index}`)
      }
      await page.waitForTimeout(settleMs)
      failIfErrors()
      seen.push(await readNarration(page))
    }
    return seen
  } catch (error) {
    // Anything unexpected (navigation rejected, evaluation failed) still names the step it happened at.
    if (error instanceof VerifyFailure) throw error
    throw fail(`${error.message ?? error}`)
  }
}

/**
 * Renders each planned route with `renderOne(slug) -> steps seen`; the first failure propagates,
 * and the total step count is returned on success.
 */
export async function renderAll(slugs, renderOne) {
  if (slugs.length === 0) throw new VerifyFailure('sample', 'no presentations are registered, so there is nothing to verify')
  let steps = 0
  for (const slug of slugs) steps += await renderOne(slug)
  return steps
}
