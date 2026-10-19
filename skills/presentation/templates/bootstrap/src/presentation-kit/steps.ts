import type { Step, StepMeta } from './types'

export function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return Math.min(Math.max(Math.trunc(index) || 0, 0), count - 1)
}

/** On-screen step number, derived from position only. */
export function formatStepNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export interface EraSection {
  era: string
  firstIndex: number
  indices: number[]
}

/** Consecutive steps sharing an era label form one section. */
export function eraSections(steps: readonly StepMeta[]): EraSection[] {
  const sections: EraSection[] = []
  steps.forEach((step, index) => {
    const last = sections[sections.length - 1]
    if (last && last.era === step.era) last.indices.push(index)
    else sections.push({ era: step.era, firstIndex: index, indices: [index] })
  })
  return sections
}

/** Problems that would make a step list unusable; empty when valid. */
export function validateSteps(steps: readonly StepMeta[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  steps.forEach((step, index) => {
    for (const field of ['id', 'era', 'title', 'caption'] as const) {
      if (typeof step[field] !== 'string' || step[field].trim() === '') {
        problems.push(`step ${index + 1} has an empty ${field}`)
      }
    }
    if (seen.has(step.id)) problems.push(`duplicate step id "${step.id}"`)
    seen.add(step.id)
  })
  return problems
}

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

/**
 * Identity of the scene instance a step renders into. Steps with equal keys
 * keep one mounted scene; anything else remounts and cross-fades.
 */
export function sceneKey(step: Pick<Step<unknown>, 'id' | 'groupKey'> & { Scene: object }): string {
  if (!step.groupKey) return `step:${step.id}`
  let id = sceneIds.get(step.Scene)
  if (id === undefined) {
    id = ++nextSceneId
    sceneIds.set(step.Scene, id)
  }
  return `group:${step.groupKey}:${id}`
}
