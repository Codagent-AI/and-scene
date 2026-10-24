import type { StepMeta } from './types'

export interface Era {
  label: string
  firstIndex: number
  lastIndex: number
}

/** Groups consecutive steps sharing an era label into table-of-contents entries. */
export function buildEras(steps: readonly StepMeta[]): Era[] {
  const eras: Era[] = []
  steps.forEach((step, i) => {
    const last = eras[eras.length - 1]
    if (last && last.label === step.era) last.lastIndex = i
    else eras.push({ label: step.era, firstIndex: i, lastIndex: i })
  })
  return eras
}
