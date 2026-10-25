import type { AnyStep, Era, OutlineEntry } from './types.ts'

/** Numbers and era grouping are derived from order, never stored on steps. */
export function buildOutline(steps: readonly AnyStep[]): { entries: OutlineEntry[]; eras: Era[] } {
  const eras: Era[] = []
  const entries = steps.map((step, index) => {
    let era = eras[eras.length - 1]
    if (!era || era.label !== step.era) {
      era = { label: step.era, firstIndex: index, indices: [] }
      eras.push(era)
    }
    era.indices.push(index)
    return { step, index, number: index + 1, eraIndex: eras.length - 1 }
  })
  return { entries, eras }
}
