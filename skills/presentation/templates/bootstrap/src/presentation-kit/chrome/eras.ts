import type { StepMeta } from '../types'
export function eras(steps: readonly StepMeta[]) {
  return steps.flatMap((s, i) => steps.findIndex(other => other.era === s.era) === i ? [{ era: s.era, index: i }] : [])
}
