import type { StepMeta } from '../types'

export function stepMarker(index: number, count: number): string {
  const width = Math.max(String(count).length, 2)
  return String(index + 1).padStart(width, '0')
}

export interface TocEntry {
  era: string
  /** Index of the first step in this era. */
  firstIndex: number
}

/** One entry per run of consecutive steps that share an era label. */
export function buildToc(steps: readonly StepMeta[]): TocEntry[] {
  const entries: TocEntry[] = []
  steps.forEach((step, i) => {
    if (entries.length === 0 || entries[entries.length - 1].era !== step.era) {
      entries.push({ era: step.era, firstIndex: i })
    }
  })
  return entries
}
