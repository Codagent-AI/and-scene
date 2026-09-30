// Failure diagnostics for `scripts/verify.mjs`.
//
// The spec requires that a console error, an uncaught page error, or a step
// that errors during render all fail verification *and identify the failing
// step* (presentation-verification: "Console or page error fails verification",
// "Step error fails verification").

/** Location label used in failure messages so the failing step is identifiable. */
export function formatStepLocation(slug, stepIndex) {
  return `/${slug} step ${stepIndex}`
}

/**
 * Reads `data-step-index` without inheriting Playwright's 30s auto-wait.
 *
 * When a step crashes during render, React unmounts the tree and the chrome
 * detaches. An unbounded read then stalls for 30s and throws a bare locator
 * timeout, which escapes the failure collector entirely — so the run reports an
 * opaque Playwright stack instead of the page error it already captured.
 * Returns null when the index cannot be read.
 */
export async function readStepIndexSafely(chrome, timeoutMs = 2000) {
  try {
    const raw = await chrome.getAttribute('data-step-index', { timeout: timeoutMs })
    // Validate the raw string rather than coercing: Number('') and Number('  ')
    // are both 0, which would read as a legitimate step 0.
    if (raw === null || !/^(0|[1-9]\d*)$/.test(raw)) return null
    return Number(raw)
  } catch {
    return null
  }
}

/** Failure message for a step whose chrome vanished mid-run. */
export function describeDetachedChrome(slug, stepIndex) {
  return `${formatStepLocation(slug, stepIndex)}: step chrome disappeared — the step almost certainly crashed while rendering`
}
