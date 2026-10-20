import type { StepMeta } from '../types.ts'

export interface TocEntry {
  era: string
  first: number
}

/** Eras in order of first appearance, each pointing at its first step. */
export function tocEntries(steps: readonly StepMeta[]): TocEntry[] {
  const entries: TocEntry[] = []
  steps.forEach((s, i) => {
    if (!entries.some((e) => e.era === s.era)) entries.push({ era: s.era, first: i })
  })
  return entries
}
