import type { Step } from '../types'

export interface Era {
  era: string
  firstIndex: number
}

/** One entry per era, in order of first appearance. */
export function erasOf<TPayload>(steps: Step<TPayload>[]): Era[] {
  const seen = new Map<string, number>()
  steps.forEach((step, index) => {
    if (!seen.has(step.era)) seen.set(step.era, index)
  })
  return [...seen].map(([era, firstIndex]) => ({ era, firstIndex }))
}
