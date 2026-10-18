import type { Step } from './types'

export interface EraGroup {
  era: string
  firstIndex: number
  lastIndex: number
}

/** Throws when a step list cannot be navigated unambiguously. */
export function validateSteps(steps: readonly Pick<Step, 'id'>[]): void {
  const seen = new Set<string>()
  for (const { id } of steps) {
    if (!id) throw new Error('Every step needs a non-empty id')
    if (seen.has(id)) throw new Error(`Duplicate step id: ${id}`)
    seen.add(id)
  }
}

/** Contiguous runs of steps sharing an era label, in order. */
export function eraGroups(steps: readonly Pick<Step, 'era'>[]): EraGroup[] {
  const groups: EraGroup[] = []
  steps.forEach(({ era }, index) => {
    const last = groups[groups.length - 1]
    if (last && last.era === era) last.lastIndex = index
    else groups.push({ era, firstIndex: index, lastIndex: index })
  })
  return groups
}

/** One-based, position-derived marker such as `3 / 9`. */
export function stepMarker(index: number, count: number): string {
  return `${index + 1} / ${count}`
}

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 1

/**
 * Key identifying the Scene instance a step renders into. Steps with equal keys
 * share one mounted Scene; any other change swaps scenes.
 */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  if (!step.groupKey) return `step:${step.id}`
  let id = sceneIds.get(step.Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(step.Scene, id)
  }
  return `group:${step.groupKey}:scene:${id}`
}
