import type { StepMeta } from './types'
export function eraEntries(steps: readonly StepMeta[]) {
  return steps.flatMap((step, index) => index === 0 || step.era !== steps[index - 1].era ? [{ era: step.era, index }] : [])
}
