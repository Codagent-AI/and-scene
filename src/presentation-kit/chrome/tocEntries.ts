import type { Step } from '../types'

export interface TocEntry {
  era: string
  /** Index of the first step in this era run. */
  firstIndex: number
}

export function tocEntries(steps: ReadonlyArray<Pick<Step<unknown>, 'era'>>): TocEntry[] {
  const entries: TocEntry[] = []
  steps.forEach((step, index) => {
    if (entries[entries.length - 1]?.era !== step.era) entries.push({ era: step.era, firstIndex: index })
  })
  return entries
}
