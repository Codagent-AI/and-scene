import type { Step, StepMeta } from './types'

/** Step numbers are derived from position, never stored. */
export const stepNumber = (index: number) => index + 1

export interface EraSection {
  era: string
  first: number
  count: number
}

export function eraSections(steps: readonly StepMeta[]): EraSection[] {
  const sections: EraSection[] = []
  steps.forEach((step, i) => {
    const last = sections[sections.length - 1]
    if (last && last.era === step.era) last.count += 1
    else sections.push({ era: step.era, first: i, count: 1 })
  })
  return sections
}

export function eraFirstIndex(steps: readonly StepMeta[], index: number): number {
  const era = steps[index]?.era
  return steps.findIndex((s) => s.era === era)
}

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

/** Steps with equal keys share one mounted scene instance. */
export function sceneKey(step: Pick<Step<unknown>, 'id' | 'groupKey'> & { Scene: object }): string {
  const scene = step.Scene
  if (!step.groupKey) return `step:${step.id}`
  let id = sceneIds.get(scene)
  if (id === undefined) sceneIds.set(scene, (id = nextSceneId++))
  return `group:${step.groupKey}:${id}`
}
