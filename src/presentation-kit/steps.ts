import type { StepMeta } from './types.ts'

export interface EraGroup {
  era: string
  /** Index of the first step of this era's run. */
  start: number
  /** Index of the last step of this era's run. */
  end: number
}

/** On-screen step number (1-based), derived from position only. */
export const stepNumber = (index: number) => index + 1

/** Consecutive steps sharing an era label, for the table of contents. */
export function groupByEra(steps: readonly StepMeta[]): EraGroup[] {
  const groups: EraGroup[] = []
  steps.forEach((step, i) => {
    const last = groups[groups.length - 1]
    if (last && last.era === step.era) last.end = i
    else groups.push({ era: step.era, start: i, end: i })
  })
  return groups
}
