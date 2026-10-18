import type { StepMeta } from '../types'

/** Entries are the distinct consecutive eras; each jumps to the era's first step. */
export function eraEntries(steps: readonly StepMeta[]): { era: string; first: number }[] {
  const entries: { era: string; first: number }[] = []
  steps.forEach((step, i) => {
    if (entries[entries.length - 1]?.era !== step.era) entries.push({ era: step.era, first: i })
  })
  return entries
}
