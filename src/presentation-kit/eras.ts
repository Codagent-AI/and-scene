import type { StepMeta } from './types'

export interface Era {
  label: string
  first: number
}

/** Eras in order of first appearance, each pointing at its first step. */
export function eraEntries(steps: readonly StepMeta[]): Era[] {
  const eras: Era[] = []
  steps.forEach((s, i) => {
    if (!eras.some((e) => e.label === s.era)) eras.push({ label: s.era, first: i })
  })
  return eras
}
