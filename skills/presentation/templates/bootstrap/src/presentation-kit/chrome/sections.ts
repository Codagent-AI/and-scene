import type { StepMeta } from '../types.ts'

export interface Section {
  era: string
  /** Index of the section's first step. */
  first: number
  /** Index of the section's last step. */
  last: number
}

/** Groups consecutive steps sharing an era label into sections. */
export function sectionsOf(steps: readonly StepMeta[]): Section[] {
  const out: Section[] = []
  steps.forEach((s, i) => {
    const prev = out[out.length - 1]
    if (prev && prev.era === s.era) prev.last = i
    else out.push({ era: s.era, first: i, last: i })
  })
  return out
}

/** Step numbers are derived from position, never stored. */
export function stepNumber(index: number): number {
  return index + 1
}
