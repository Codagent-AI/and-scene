// Pure-ish helpers for verify.mjs, kept separate so they can be unit tested with a fake page.

export class VerifyFailure extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

export const isFatalConsoleType = (type) => type === 'error'

export function isFatalResponse(url, status, origin) {
  return url.startsWith(origin) && status >= 400 && !url.endsWith('/favicon.ico')
}

export const isFatalRequestFailure = (url, origin) => url.startsWith(origin)

/**
 * Subscribes to browser faults. Call before navigating so load-time errors are seen.
 * `record(stepIndex, message)` receives each fault attributed to the step in flight.
 */
export function attachErrorCollectors(page, { origin, getStep, record }) {
  page.on('console', (message) => {
    if (isFatalConsoleType(message.type())) record(getStep(), `console.error: ${message.text()}`)
  })
  page.on('pageerror', (error) => record(getStep(), `uncaught error: ${error.message}`))
  page.on('requestfailed', (request) => {
    if (isFatalRequestFailure(request.url(), origin)) record(getStep(), `request failed: ${request.url()}`)
  })
  page.on('response', (response) => {
    if (isFatalResponse(response.url(), response.status(), origin)) {
      record(getStep(), `HTTP ${response.status()}: ${response.url()}`)
    }
  })
}

/** Waits for the public step hook to show `index`; a stalled transition fails instead of hanging. */
export async function waitForStepIndex(page, index, timeoutMs, slug = 'presentation') {
  try {
    await page.waitForFunction(
      (want) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(want),
      index,
      { timeout: timeoutMs },
    )
  } catch {
    throw new VerifyFailure('render', `${slug}: transition did not advance to step index ${index}`, index)
  }
}
