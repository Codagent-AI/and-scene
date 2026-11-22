import type { StepMeta } from '../types'

export function eras(steps: readonly StepMeta[]) {
  const seen = new Set<string>()
  return steps.flatMap((step, index) => {
    if (seen.has(step.era)) return []
    seen.add(step.era)
    return [{ era: step.era, index }]
  })
}
