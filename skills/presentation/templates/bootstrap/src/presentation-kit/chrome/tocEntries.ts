import type { StepMeta } from '../types'

export interface TocEntry {
  era: string
  firstIndex: number
}

/** One entry per consecutive run of steps sharing an era label. */
export function tocEntries(steps: readonly StepMeta[]): TocEntry[] {
  const entries: TocEntry[] = []
  steps.forEach((step, firstIndex) => {
    if (entries[entries.length - 1]?.era !== step.era) entries.push({ era: step.era, firstIndex })
  })
  return entries
}
