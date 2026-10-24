import type { StepMeta } from './types'

let nextSceneId = 0
const sceneIds = new WeakMap<object, number>()

function sceneId(Scene: object): number {
  let id = sceneIds.get(Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(Scene, id)
  }
  return id
}

/** React key for the step's scene: shared by adjacent steps of one group and Scene. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  return step.groupKey ? `group:${step.groupKey}:${sceneId(step.Scene)}` : `step:${step.id}`
}

/** On-screen step number (1-based), derived from position. */
export function stepNumber(index: number): number {
  return index + 1
}

export function formatStepNumber(index: number, count: number): string {
  const width = String(count).length
  return String(stepNumber(index)).padStart(width, '0')
}

export interface Section {
  era: string
  /** Index of the first step of this era. */
  first: number
  indexes: number[]
}

/** Table-of-contents sections: one per era label, in order of first appearance. */
export function sectionsOf(steps: readonly StepMeta[]): Section[] {
  const sections: Section[] = []
  steps.forEach((step, index) => {
    const found = sections.find((s) => s.era === step.era)
    if (found) found.indexes.push(index)
    else sections.push({ era: step.era, first: index, indexes: [index] })
  })
  return sections
}

/** Throws when steps cannot form a valid presentation. */
export function validateSteps(steps: readonly StepMeta[]): void {
  if (steps.length === 0) throw new Error('A presentation needs at least one step')
  const seen = new Set<string>()
  for (const step of steps) {
    for (const field of ['id', 'era', 'title', 'caption'] as const) {
      if (!step[field]) throw new Error(`Step "${step.id || '?'}" is missing ${field}`)
    }
    if (seen.has(step.id)) throw new Error(`Duplicate step id "${step.id}"`)
    seen.add(step.id)
  }
}
