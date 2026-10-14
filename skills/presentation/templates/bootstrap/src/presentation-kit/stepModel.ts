import type { StepMeta } from './types'

/** On-screen step number, derived from position so inserts never need renumbering. */
export function stepNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export interface EraStart {
  era: string
  /** Index of the first step in this era; a table-of-contents jump lands here. */
  firstIndex: number
}

/** Era groups in deck order. Non-adjacent repeats of an era start a new group. */
export function eraStarts(steps: ReadonlyArray<StepMeta>): EraStart[] {
  return steps.reduce<EraStart[]>((starts, step, index) => {
    if (starts.at(-1)?.era !== step.era) starts.push({ era: step.era, firstIndex: index })
    return starts
  }, [])
}

/** The era group that contains the given step index. */
export function eraOf(starts: ReadonlyArray<EraStart>, index: number): number {
  let current = 0
  starts.forEach((start, position) => {
    if (start.firstIndex <= index) current = position
  })
  return current
}
