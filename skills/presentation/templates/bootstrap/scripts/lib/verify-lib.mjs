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

/** Reads `{ slug, title }` pairs from the explicit presentation registry source. */
export function parseRegistry(source) {
  const entries = []
  const pattern = /slug:\s*(['"`])([^'"`]+)\1\s*,\s*title:\s*(['"`])([^]*?)\3\s*,/g
  for (const match of source.matchAll(pattern)) entries.push({ slug: match[2], title: match[4] })
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
  const fail = (message, index, total) =>
    new VerifyFailure('render', message, { slug, step: index === undefined ? undefined : index + 1, index, total })
  const failIfErrors = (index, total) => {
    const errors = collector.drain()
    if (errors.length) throw fail(errors.join('; '), index, total)
  }

  await page.goto(`${url}/${slug}`, { waitUntil: 'load' })
  try {
    await page.waitForSelector('[data-step-count]', { timeout: stepTimeoutMs })
  } catch {
    failIfErrors(0)
    throw fail(`/${slug} did not render a presentation (no data-step-count hook)`, 0)
  }
  const total = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
  if (!(total > 0)) throw fail('presentation reports no steps', 0, total)
  const initial = await readIndex(page)
  if (initial !== 0) throw fail(`opened on step index ${initial} instead of 0`, 0, total)

  const seen = []
  for (let index = 0; index < total; index++) {
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
        failIfErrors(index, total)
        const actual = await readIndex(page)
        throw fail(`ArrowRight did not advance to index ${index} (stayed at ${actual})`, index, total)
      }
      const actual = await readIndex(page)
      if (!isAdvance(index - 1, actual)) throw fail(`transition landed on index ${actual}, expected ${index}`, index, total)
    }
    await page.waitForTimeout(settleMs)
    failIfErrors(index, total)
    seen.push(await readNarration(page))
  }
  return seen
}
