import type { StepMeta } from '../types'

export interface Era {
  label: string
  firstIndex: number
}

/** Eras in order of first appearance, each with the index of its first step. */
export function getEras(steps: readonly StepMeta[]): Era[] {
  const eras: Era[] = []
  steps.forEach((step, firstIndex) => {
    if (!eras.some((era) => era.label === step.era)) eras.push({ label: step.era, firstIndex })
  })
  return eras
}
