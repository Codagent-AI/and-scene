/**
 * Waits for step transitions to settle, then runs `capture`. Returns the
 * milliseconds that elapsed between the call and the capture.
 */
export async function settleThenCapture({ settleMs, sleep, now = Date.now, capture }) {
  const start = now()
  await sleep(settleMs)
  const elapsed = now() - start
  await capture()
  return elapsed
}
