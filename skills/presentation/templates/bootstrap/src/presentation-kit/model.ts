import type { Step, StepMeta } from './types'
export function sceneKey<T>(steps: readonly Step<T>[], index: number) {
  const step = steps[index]
  let first = index
  if (step.groupKey) while (first > 0 && steps[first - 1].groupKey === step.groupKey && steps[first - 1].Scene === step.Scene) first--
  return steps[first].id
}
export function eras(steps: readonly StepMeta[]) { return steps.flatMap((step, index) => steps.findIndex(s => s.era === step.era) === index ? [{ era: step.era, index }] : []) }
