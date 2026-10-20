import type { StepMeta } from '../types.ts'

export interface TocEntry {
  era: string
  /** Index of the first step in this era. */
  start: number
  active: boolean
}

/** Group consecutive steps that share an era label. */
export function buildToc(steps: readonly StepMeta[], activeIndex: number): TocEntry[] {
  const entries: TocEntry[] = []
  steps.forEach((step, i) => {
    if (entries.length === 0 || entries[entries.length - 1].era !== step.era) {
      entries.push({ era: step.era, start: i, active: false })
    }
  })
  entries.forEach((entry, i) => {
    const end = i + 1 < entries.length ? entries[i + 1].start : steps.length
    entry.active = activeIndex >= entry.start && activeIndex < end
  })
  return entries
}
