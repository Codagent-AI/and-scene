import type { ComponentType } from 'react'
import type { Step, StepMeta } from './types.ts'

/** On-screen number of a step, derived from its position only. */
export const stepNumber = (index: number) => index + 1

export const formatMarker = (index: number, total: number) => `${stepNumber(index)} / ${total}`

export interface EraSection {
  era: string
  firstIndex: number
  indices: number[]
}

/** Consecutive steps sharing an era label form one table-of-contents section. */
export function eraSections(steps: readonly StepMeta[]): EraSection[] {
  const sections: EraSection[] = []
  steps.forEach((step, index) => {
    const last = sections[sections.length - 1]
    if (last && last.era === step.era) last.indices.push(index)
    else sections.push({ era: step.era, firstIndex: index, indices: [index] })
  })
  return sections
}

export const sectionIndexOf = (sections: readonly EraSection[], index: number) =>
  sections.findIndex((s) => s.indices.includes(index))

const sceneIds = new WeakMap<ComponentType<never>, number>()
let nextSceneId = 1

function sceneId(Scene: ComponentType<never>) {
  let id = sceneIds.get(Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(Scene, id)
  }
  return id
}

/**
 * Identity of the scene instance a step renders into. Steps with equal keys
 * keep one mounted instance; any other transition remounts.
 */
export function sceneKey<TPayload>(step: Step<TPayload>) {
  return step.groupKey === undefined
    ? `step:${step.id}`
    : `group:${step.groupKey}:${sceneId(step.Scene as ComponentType<never>)}`
}
