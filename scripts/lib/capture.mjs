import path from 'node:path'
import { defaultSleep } from './loopback.mjs'
import { waitForIndex } from './step-driver.mjs'

export const DEFAULT_SETTLE_MS = 900
export const stepFile = (index) => `step-${String(index + 1).padStart(2, '0')}.png`

/**
 * Visit every step in order. Each capture happens only after the step index has
 * advanced and the settle interval has elapsed. `shoot(file)` and `snapshot()`
 * are injected so the loop can be tested without a browser.
 */
export async function captureSteps({ page, count, outDir, settleMs = DEFAULT_SETTLE_MS, indexTimeoutMs = 5000, shoot, snapshot, sleep = defaultSleep, now = Date.now }) {
  const records = []
  for (let i = 0; i < count; i++) {
    if (i > 0) await page.keyboard.press('ArrowRight')
    const state = await waitForIndex(page, i, { sleep, timeoutMs: indexTimeoutMs })
    if (state?.index !== i) throw new Error(`step index did not reach ${i} (stuck at ${state?.index})`)
    const settledFrom = now()
    await sleep(settleMs)
    const file = path.join(outDir, stepFile(i))
    await shoot(file)
    records.push({ index: i, file, settleMs, waitedMs: now() - settledFrom, snapshot: await snapshot() })
  }
  return records
}
