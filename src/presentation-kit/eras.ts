import type { StepMeta } from './types.ts'

export interface EraGroup {
  era: string
  /** Index of the first step in this consecutive era run. */
  firstIndex: number
  /** Indices of the steps in the run. */
  indices: number[]
}

/** One group per consecutive run of identical era labels, in step order. */
export function groupEras(steps: readonly Pick<StepMeta, 'era'>[]): EraGroup[] {
  const groups: EraGroup[] = []
  steps.forEach((s, i) => {
    const last = groups[groups.length - 1]
    if (last && last.era === s.era) last.indices.push(i)
    else groups.push({ era: s.era, firstIndex: i, indices: [i] })
  })
  return groups
}
