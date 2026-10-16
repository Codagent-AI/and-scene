import type { AnyStep, StepMeta } from './types'

export interface EraEntry {
  era: string
  /** Index of the first step in this era. */
  start: number
}

/** Order-derived 1-based step number. */
export const stepNumber = (index: number) => index + 1

export const clampIndex = (index: number, count: number) =>
  Math.max(0, Math.min(count - 1, index))

/** Consecutive steps with the same era label form one table-of-contents entry. */
export function eraEntries(steps: readonly Pick<StepMeta, 'era'>[]): EraEntry[] {
  const out: EraEntry[] = []
  steps.forEach((s, i) => {
    if (out[out.length - 1]?.era !== s.era) out.push({ era: s.era, start: i })
  })
  return out
}

/** Index of the era entry that contains step `index`. */
export function activeEraIndex(entries: readonly EraEntry[], index: number) {
  let active = 0
  entries.forEach((e, i) => {
    if (e.start <= index) active = i
  })
  return active
}

/** Key identifying the mounted scene instance for a step. */
export function sceneKey(step: AnyStep) {
  return step.groupKey ?? step.id
}
