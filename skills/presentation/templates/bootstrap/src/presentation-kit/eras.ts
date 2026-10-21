import type { StepMeta } from './types'

export interface EraRun {
  era: string
  /** Index of the run's first step. */
  start: number
  /** Number of consecutive steps sharing the era label. */
  length: number
}

/** Maximal runs of consecutive steps that share an era label. */
export function groupEras(steps: ReadonlyArray<Pick<StepMeta, 'era'>>): EraRun[] {
  const runs: EraRun[] = []
  steps.forEach((step, index) => {
    const last = runs[runs.length - 1]
    if (last && last.era === step.era) last.length += 1
    else runs.push({ era: step.era, start: index, length: 1 })
  })
  return runs
}

/** The run containing the step at `index`. */
export function eraRunIndex(runs: EraRun[], index: number): number {
  return runs.findIndex((run) => index >= run.start && index < run.start + run.length)
}
