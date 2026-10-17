/**
 * Longest scene motion is a layout move followed by an entry fade
 * (ENTER_DELAY + ENTER_T = 0.85 s in the kit); the default leaves headroom.
 */
export const DEFAULT_SETTLE_MS = 900

/** Precedence: command-line flag, then INSPECT_SETTLE_MS, then the default. */
export function resolveSettleMs({ flag, env = process.env } = {}) {
  for (const candidate of [flag, env.INSPECT_SETTLE_MS]) {
    if (candidate === undefined || candidate === '') continue
    const value = Number(candidate)
    if (Number.isFinite(value) && value >= 0) return value
  }
  return DEFAULT_SETTLE_MS
}
