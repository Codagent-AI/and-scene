import type { StepMeta } from '../types'
export function eras(steps: readonly StepMeta[]) { return steps.flatMap((s, index) => steps.findIndex(x => x.era === s.era) === index ? [{ era: s.era, index }] : []) }
