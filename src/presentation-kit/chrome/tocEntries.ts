import type { Step } from '../types'

export interface TocEntryData {
  era: string
  /** Index of the first step of this era. */
  first: number
}

/** Groups consecutive steps with equal `era` labels. */
export function tocEntries(steps: ReadonlyArray<Pick<Step<unknown>, 'era'>>): TocEntryData[] {
  const entries: TocEntryData[] = []
  steps.forEach((s, i) => {
    if (entries.length === 0 || entries[entries.length - 1].era !== s.era) entries.push({ era: s.era, first: i })
  })
  return entries
}
