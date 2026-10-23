import type { Step } from '../types'

export interface TocEntry {
  era: string
  firstIndex: number
}

/** One entry per era, in order of first appearance. */
export function tocEntries<TPayload>(steps: readonly Step<TPayload>[]): TocEntry[] {
  const entries: TocEntry[] = []
  steps.forEach((step, index) => {
    if (!entries.some((entry) => entry.era === step.era)) entries.push({ era: step.era, firstIndex: index })
  })
  return entries
}
