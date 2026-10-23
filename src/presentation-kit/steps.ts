import type { Step } from './types.ts'

/** Throws when the step list cannot drive a presentation. */
export function validateSteps(
  steps: readonly (Pick<Step, 'id' | 'era' | 'title' | 'caption'> & { Scene?: unknown })[],
): void {
  if (steps.length === 0) throw new Error('A presentation needs at least one step')
  const seen = new Set<string>()
  steps.forEach((step, i) => {
    for (const field of ['id', 'era', 'title', 'caption'] as const) {
      if (typeof step[field] !== 'string' || step[field].trim() === '') {
        throw new Error(`Step ${i} is missing required field "${field}"`)
      }
    }
    if (typeof step.Scene !== 'function' && typeof step.Scene !== 'object') {
      throw new Error(`Step "${step.id}" is missing its Scene`)
    }
    if (seen.has(step.id)) throw new Error(`Duplicate step id "${step.id}"`)
    seen.add(step.id)
  })
}

export interface Era {
  label: string
  firstIndex: number
  indices: number[]
}

/** Groups consecutive steps that share an era label, in step order. */
export function computeEras(steps: readonly { era: string }[]): Era[] {
  const eras: Era[] = []
  steps.forEach((step, index) => {
    const last = eras[eras.length - 1]
    if (last && last.label === step.era) last.indices.push(index)
    else eras.push({ label: step.era, firstIndex: index, indices: [index] })
  })
  return eras
}

/** On-screen marker derived from position, never stored. */
export function stepMarker(index: number): string {
  return String(index + 1).padStart(2, '0')
}
