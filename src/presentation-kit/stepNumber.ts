/** On-screen step number, derived from position so reordering needs no renumbering. */
export function stepNumber(index: number): number {
  return index + 1
}

export interface EraGroup {
  era: string
  /** Index of the first step in this era. */
  firstIndex: number
  indices: number[]
}

/** Groups consecutive steps by era label, in order of first appearance. */
export function groupByEra(steps: readonly { era: string }[]): EraGroup[] {
  const groups: EraGroup[] = []
  steps.forEach((step, i) => {
    const last = groups[groups.length - 1]
    if (last && last.era === step.era) last.indices.push(i)
    else groups.push({ era: step.era, firstIndex: i, indices: [i] })
  })
  return groups
}
