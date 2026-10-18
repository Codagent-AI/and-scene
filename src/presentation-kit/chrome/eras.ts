import type { StepMeta } from '../types'

/** One entry per distinct era label, jumping to that era's first step. */
export function eraEntries(steps: readonly StepMeta[]): { era: string; first: number }[] {
  const entries: { era: string; first: number }[] = []
  steps.forEach((step, i) => {
    if (!entries.some((e) => e.era === step.era)) entries.push({ era: step.era, first: i })
  })
  return entries
}
