import type { StepMeta } from './types'

export interface EraEntry {
  era: string
  /** Index of the first step carrying this era label. */
  firstIndex: number
}

/** Distinct era labels in order of first appearance. */
export function eraEntries(steps: readonly Pick<StepMeta, 'era'>[]): EraEntry[] {
  const seen = new Map<string, EraEntry>()
  steps.forEach((s, i) => {
    if (!seen.has(s.era)) seen.set(s.era, { era: s.era, firstIndex: i })
  })
  return [...seen.values()]
}

/** On-screen step number, derived from position only. */
export const stepNumber = (index: number) => index + 1
