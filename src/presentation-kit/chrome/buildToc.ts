import type { StepMeta } from '../types'

export interface TocEntry {
  era: string
  /** Index of the first step of this era run. */
  firstIndex: number
}

/** Collapse consecutive steps with the same era into one entry. */
export function buildToc(steps: readonly StepMeta[]): TocEntry[] {
  const entries: TocEntry[] = []
  steps.forEach((s, i) => {
    if (entries.length === 0 || entries[entries.length - 1].era !== s.era) {
      entries.push({ era: s.era, firstIndex: i })
    }
  })
  return entries
}
