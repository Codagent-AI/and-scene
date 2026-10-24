import type { StepMeta } from './types.ts'

/** On-screen step number, derived from position so reordering never needs renumbering. */
export function stepNumber(index: number): number {
  return index + 1
}

export interface EraGroup {
  era: string
  /** Index of the era's first step. */
  first: number
  indices: number[]
}

/** Groups consecutive steps by era, in order of first appearance. */
export function groupByEra(steps: readonly StepMeta[]): EraGroup[] {
  const groups: EraGroup[] = []
  steps.forEach((step, i) => {
    const last = groups[groups.length - 1]
    if (last && last.era === step.era) last.indices.push(i)
    else groups.push({ era: step.era, first: i, indices: [i] })
  })
  return groups
}
