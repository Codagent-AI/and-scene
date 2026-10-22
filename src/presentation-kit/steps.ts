import type { StepMeta } from './types.ts'

const REQUIRED = ['id', 'era', 'title', 'caption'] as const

/** Returns human-readable problems; an empty list means the steps are valid. */
export function validateSteps(steps: readonly Partial<StepMeta>[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  steps.forEach((step, index) => {
    for (const field of REQUIRED) {
      const value = step[field]
      if (typeof value !== 'string' || value.trim() === '') {
        problems.push(`step ${index}: missing or empty "${field}"`)
      }
    }
    if (typeof step.id === 'string' && step.id !== '') {
      if (seen.has(step.id)) problems.push(`step ${index}: duplicate id "${step.id}"`)
      seen.add(step.id)
    }
  })
  return problems
}

/** On-screen step number; always derived from position. */
export function stepNumber(index: number): number {
  return index + 1
}

export interface TocEntry {
  era: string
  firstIndex: number
  indices: number[]
}

/** Groups consecutive steps sharing an era label into table-of-contents entries. */
export function buildToc(steps: readonly Pick<StepMeta, 'era'>[]): TocEntry[] {
  const entries: TocEntry[] = []
  steps.forEach((step, index) => {
    const last = entries[entries.length - 1]
    if (last && last.era === step.era) last.indices.push(index)
    else entries.push({ era: step.era, firstIndex: index, indices: [index] })
  })
  return entries
}
