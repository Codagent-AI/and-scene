import type { StepMeta } from '../types.ts'

/** Era entries in order of first appearance. */
export function tocEras(steps: readonly Pick<StepMeta, 'era'>[]): string[] {
  return [...new Set(steps.map((s) => s.era))]
}
