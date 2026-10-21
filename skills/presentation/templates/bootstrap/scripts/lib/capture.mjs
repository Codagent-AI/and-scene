// Settled per-step capture loop of the screenshot helper, independent of the browser
// so its ordering (advance -> wait -> collect -> screenshot) is unit-testable.
import { diagnoseStep } from './diagnostics.mjs'

export const DEFAULT_VIEWPORT = '1440x900'
export const DEFAULT_SETTLE_MS = 1000

export class CaptureError extends Error {}

export const stepFile = (step) => `step-${String(step).padStart(2, '0')}.png`

/**
 * driver: { advance(i), wait(ms), collect(), screenshot(file), now(), log(line) }.
 * Step 0 is already shown; each later step is advanced to, then settled, then captured.
 */
export async function captureSteps({ count, settleMs, driver }) {
  const steps = []
  const warnings = []
  for (let i = 0; i < count; i++) {
    const navigatedAt = driver.now()
    if (i > 0) await driver.advance(i)
    await driver.wait(settleMs)
    const data = await driver.collect()
    if (data.index !== String(i)) throw new CaptureError(`expected step index ${i} at capture ${i + 1}, found ${data.index}`)
    const file = stepFile(i + 1)
    await driver.screenshot(file)
    const found = diagnoseStep(i + 1, data)
    warnings.push(...found)
    steps.push({ step: i + 1, file, index: i, title: data.title, navigatedAt, capturedAt: driver.now(), warnings: found.length })
    driver.log?.(`step ${i + 1}/${count} captured ${file}`, found)
  }
  return { steps, warnings }
}
