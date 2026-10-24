import type { StepMeta, AnyStep } from './types'

/** On-screen step number, derived from position so reordering renumbers for free. */
export const stepNumber = (index: number) => index + 1

export const stepMarker = (index: number, count: number) => `${stepNumber(index)} / ${count}`

export interface Section {
  era: string
  /** Index of the section's first step. */
  first: number
  /** Indices of every step in the section. */
  indices: number[]
}

/** Group consecutive steps sharing an era label. */
export function sectionsOf(steps: ReadonlyArray<Pick<StepMeta, 'era'>>): Section[] {
  const sections: Section[] = []
  steps.forEach((step, index) => {
    const last = sections[sections.length - 1]
    if (last && last.era === step.era) last.indices.push(index)
    else sections.push({ era: step.era, first: index, indices: [index] })
  })
  return sections
}

export const sectionIndexOf = (sections: Section[], stepIndex: number) =>
  sections.findIndex((s) => s.indices.includes(stepIndex))

const REQUIRED = ['id', 'era', 'title', 'caption'] as const

/** Returns a human-readable problem per defect; empty when the steps are valid. */
export function validateSteps(steps: ReadonlyArray<Partial<AnyStep>>): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  steps.forEach((step, i) => {
    for (const field of REQUIRED) {
      const value = step[field]
      if (typeof value !== 'string' || value.trim() === '') {
        problems.push(`step ${i + 1}: missing ${field}`)
      }
    }
    const scene = step.Scene as unknown
    if (typeof scene !== 'function' && (typeof scene !== 'object' || scene === null)) {
      problems.push(`step ${i + 1}: missing Scene`)
    }
    if (typeof step.id === 'string' && step.id !== '') {
      if (seen.has(step.id)) problems.push(`step ${i + 1}: duplicate id "${step.id}"`)
      seen.add(step.id)
    }
  })
  return problems
}

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

/**
 * React key for the scene host. Steps sharing a `groupKey` and `Scene` share a
 * key, so the scene instance persists; anything else gets its own instance.
 */
export function sceneKey(step: Pick<AnyStep, 'id' | 'groupKey' | 'Scene'>): string {
  if (step.groupKey === undefined) return `step:${step.id}`
  let id = sceneIds.get(step.Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(step.Scene, id)
  }
  return `group:${step.groupKey}:${id}`
}
