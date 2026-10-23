import type { PresentationStep } from '../types'

/** Eras in order with the index of the first step of each. */
export function eraEntries(steps: readonly PresentationStep[]): { era: string; first: number }[] {
  const entries: { era: string; first: number }[] = []
  steps.forEach((s, i) => {
    if (!entries.some((e) => e.era === s.era)) entries.push({ era: s.era, first: i })
  })
  return entries
}
