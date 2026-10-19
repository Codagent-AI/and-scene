import type { StepMeta } from './types'

export interface EraEntry {
  era: string
  /** Index of the first step of this (consecutive) era. */
  first: number
  /** Whether the active step belongs to this era. */
  active: boolean
}

/** Table-of-contents entries: one per run of consecutive steps sharing an era. */
export function eraEntries(steps: readonly StepMeta[], activeIndex: number): EraEntry[] {
  const out: { era: string; first: number; last: number }[] = []
  steps.forEach((s, i) => {
    const tail = out[out.length - 1]
    if (tail && tail.era === s.era) tail.last = i
    else out.push({ era: s.era, first: i, last: i })
  })
  return out.map((e) => ({ era: e.era, first: e.first, active: activeIndex >= e.first && activeIndex <= e.last }))
}

/** Zero-padded on-screen step number derived from position. */
export function stepNumber(index: number, count: number): string {
  return String(index + 1).padStart(String(count).length, '0')
}
