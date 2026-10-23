import type { StepMeta } from './types'

export interface Era {
  era: string
  /** Index of the first step of this era. */
  firstIndex: number
  indices: number[]
}

/** Groups steps into consecutive eras, in order of appearance. */
export function groupEras(steps: readonly StepMeta[]): Era[] {
  const eras: Era[] = []
  steps.forEach((step, i) => {
    const last = eras[eras.length - 1]
    if (last && last.era === step.era) last.indices.push(i)
    else eras.push({ era: step.era, firstIndex: i, indices: [i] })
  })
  return eras
}

export function formatStepNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}
