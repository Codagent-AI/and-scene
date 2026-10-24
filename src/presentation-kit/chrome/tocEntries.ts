import type { Step } from '../types'

export interface TocEntry {
  era: string
  firstIndex: number
  active: boolean
}

/** One entry per era, in order of first appearance. */
export function tocEntries<T>(steps: Step<T>[], activeIndex: number): TocEntry[] {
  const entries: TocEntry[] = []
  steps.forEach((s, i) => {
    if (!entries.some((e) => e.era === s.era)) {
      entries.push({ era: s.era, firstIndex: i, active: false })
    }
  })
  const activeEra = steps[activeIndex]?.era
  return entries.map((e) => ({ ...e, active: e.era === activeEra }))
}
