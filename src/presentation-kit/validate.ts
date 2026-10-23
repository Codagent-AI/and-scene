import type { StepMeta } from './types'

type StepLike = StepMeta & { Scene?: unknown }

/** Returns a list of problems; empty when the step array is usable. */
export function validateSteps(steps: readonly StepLike[]): string[] {
  const problems: string[] = []
  if (steps.length === 0) problems.push('a presentation needs at least one step')
  const seen = new Set<string>()
  steps.forEach((step, i) => {
    for (const field of ['id', 'era', 'title', 'caption'] as const) {
      if (typeof step[field] !== 'string' || step[field].trim() === '') {
        problems.push(`step ${i} is missing "${field}"`)
      }
    }
    if (typeof step.id === 'string' && step.id !== '') {
      if (seen.has(step.id)) problems.push(`duplicate step id "${step.id}"`)
      seen.add(step.id)
    }
    if (!step.Scene) problems.push(`step ${i} is missing "Scene"`)
  })
  return problems
}

export function eraEntries(steps: readonly { era: string }[]): { era: string; firstIndex: number }[] {
  const entries: { era: string; firstIndex: number }[] = []
  steps.forEach((step, i) => {
    if (!entries.some((e) => e.era === step.era)) entries.push({ era: step.era, firstIndex: i })
  })
  return entries
}
