import { defaultSleep } from './loopback.mjs'
import { VerifyError } from './report.mjs'
import { validateRendered } from './outline.mjs'

/** Runs in the page: the public hooks every presentation exposes. */
export function readHooks() {
  const root = document.querySelector('[data-presentation-root]')
  if (!root) return null
  const text = (sel) => document.querySelector(sel)?.textContent ?? undefined
  return {
    count: Number(root.getAttribute('data-step-count')),
    index: Number(root.getAttribute('data-step-index')),
    title: text('[data-presentation-step-title]'),
    caption: text('[data-presentation-caption]'),
    era: text('[data-presentation-toc-item][data-presentation-active]'),
  }
}

/** Start collecting console errors and uncaught page errors, tagged with the current step. */
export function collectErrors(page, currentStep) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ step: currentStep(), text: `console.error: ${msg.text()}` })
  })
  page.on('pageerror', (err) => errors.push({ step: currentStep(), text: `uncaught error: ${err?.message ?? err}` }))
  return errors
}

async function waitFor(read, ok, { timeoutMs, intervalMs, sleep }) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const state = await read()
    if (ok(state)) return state
    if (Date.now() >= deadline) return state
    await sleep(intervalMs)
  }
}

/** Wait until the public step index equals `index`; returns the last hooks read. */
export const waitForIndex = (page, index, { timeoutMs = 5000, intervalMs = 50, sleep = defaultSleep } = {}) =>
  waitFor(() => page.evaluate(readHooks), (s) => s?.index === index, { timeoutMs, intervalMs, sleep })

/**
 * Open a presentation route and step through every step with ArrowRight.
 * Throws a VerifyError naming the phase and failing step index on any browser
 * error, missing hook, or transition that does not advance the step index.
 *
 * @param {unknown} page
 * @param {string} url
 * @param {{ outline?: { era?: string, title: string, caption: string }[], timeoutMs?: number, stepSettleMs?: number, onStep?: (step: { index: number, title?: string }) => void, sleep?: (ms: number) => Promise<void> }} [options]
 */
export async function driveSteps(page, url, { outline, timeoutMs = 5000, stepSettleMs = 150, onStep, sleep = defaultSleep } = {}) {
  let step = 0
  const errors = collectErrors(page, () => step)
  const fail = (message, at = step) => {
    throw new VerifyError('render', message, { step: at })
  }
  const check = () => {
    if (errors.length > 0) fail(errors[0].text, errors[0].step)
  }
  const timing = { timeoutMs, sleep }

  try {
    await page.goto(url)
  } catch (err) {
    fail(`could not open ${url}: ${err instanceof Error ? err.message : err}`)
  }
  const first = await waitFor(() => page.evaluate(readHooks), (s) => s !== null && s.count > 0, { ...timing, intervalMs: 50 })
  check()
  if (!first || !(first.count > 0)) fail(`no presentation step hooks found at ${url}`)

  const rendered = []
  for (let i = 0; i < first.count; i++) {
    step = i
    const state = await waitForIndex(page, i, timing)
    if (state?.index !== i) fail(`step index did not reach ${i} (stuck at ${state?.index})`, i)
    if (state.count !== first.count) fail(`step count changed from ${first.count} to ${state.count}`, i)
    rendered.push({ index: i, title: state.title, caption: state.caption, era: state.era })
    await sleep(stepSettleMs)
    check()
    onStep?.({ index: i, title: state.title })
    if (i === first.count - 1) break
    step = i + 1
    await page.keyboard.press('ArrowRight')
    const after = await waitForIndex(page, i + 1, timing)
    check()
    if (after?.index !== i + 1) fail(`transition from step index ${i} did not advance (index stayed ${after?.index})`, i + 1)
  }

  if (outline) {
    const problems = validateRendered(rendered, outline)
    if (problems.length > 0) throw new VerifyError('sample', problems.join('; '))
  }
  return { count: first.count, rendered }
}
