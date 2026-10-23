import { VerifyError, normalize } from './verify-core.mjs'

// Longer than an entrance: ENTER_DELAY (0.65s) + ENTER_T (0.4s) in the scene kit.
const SETTLE_MS = 1300

/** Records console errors and uncaught page errors; install before navigating. */
export function collectBrowserErrors(page) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console error: ${msg.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`uncaught page error: ${error.message}`))
  return errors
}

async function readState(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-step-count]')
    if (!root) return null
    const text = (sel) => document.querySelector(sel)?.textContent ?? ''
    const mode = root.getAttribute('data-presentation-mode')
    return {
      count: Number(root.getAttribute('data-step-count')),
      index: Number(root.getAttribute('data-step-index')),
      title: text(mode === 'present' ? '[data-presentation-title]' : '[data-presentation-header-title]'),
      caption: text('[data-presentation-caption]'),
      mode,
    }
  })
}

/** Polls the public step hooks until `data-step-index` equals `expected`. */
async function waitForIndex(page, expected, timeoutMs, onTimeout) {
  const deadline = Date.now() + timeoutMs
  let state = null
  while (Date.now() < deadline) {
    state = await readState(page)
    if (state && state.index === expected) return state
    await page.waitForTimeout(50)
  }
  throw new VerifyError('render', onTimeout(state), { step: expected })
}

/**
 * Opens one route and steps through it. Error listeners are installed by the
 * caller before navigation and stay attached for the whole run; `errors` is
 * the shared list they append to.
 */
export async function renderRoute({ page, url, allSteps, reference, errors, timeoutMs, log }) {
  const check = (step) => {
    if (errors.length > 0) throw new VerifyError('render', errors[0], { step })
  }
  // `errors` is never cleared: anything that arrived since the last check, even
  // after the previous route returned, fails the run instead of being discarded.
  await page.goto(url, { waitUntil: 'load' })
  const first = await waitForIndex(page, 0, timeoutMs, (s) =>
    s ? `step hooks report index ${s.index}, expected 0` : 'no [data-step-count] hook rendered (the route did not render a presentation)',
  )
  const count = first.count
  if (!(count >= 1)) throw new VerifyError('render', `data-step-count is ${count}`, { step: 0 })
  if (reference && count !== reference.steps.length) {
    throw new VerifyError('render', `renders ${count} steps, reference has ${reference.steps.length}`, { step: 0 })
  }
  const last = allSteps ? count - 1 : 0
  for (let i = 0; i <= last; i++) {
    const state =
      i === 0
        ? first
        : await (async () => {
            await page.keyboard.press('ArrowRight')
            return waitForIndex(page, i, timeoutMs, (s) =>
              `transition did not advance: data-step-index is ${s ? s.index : 'missing'}, expected ${i} within ${timeoutMs}ms`,
            )
          })()
    if (reference) {
      const want = reference.steps[i]
      if (normalize(state.title) !== normalize(want.title)) {
        throw new VerifyError('render', `rendered title "${state.title}", expected "${want.title}"`, { step: i })
      }
      if (state.mode === 'browse' && normalize(state.caption) !== normalize(want.caption)) {
        throw new VerifyError('render', `rendered caption "${state.caption}", expected "${want.caption}"`, { step: i })
      }
    }
    await page.waitForTimeout(SETTLE_MS)
    check(i)
    log(`  step index ${i} ok (${i + 1}/${count})`)
  }
  return { count, rendered: last + 1 }
}
