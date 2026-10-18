import type { AnyStep, Era } from './types'

/** Distinct era labels in order of first appearance, each with its first step index. */
export function deriveEras(steps: readonly AnyStep[]): Era[] {
  const eras: Era[] = []
  steps.forEach((step, firstIndex) => {
    if (!eras.some((era) => era.label === step.era)) eras.push({ label: step.era, firstIndex })
  })
  return eras
}

/** On-screen step number: derived from position, never stored. */
export function stepNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

/** Identity of the mounted scene instance: same key means the instance persists. */
export function sceneKey(step: AnyStep): string {
  let id = sceneIds.get(step.Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(step.Scene, id)
  }
  return `${step.groupKey ?? step.id}#${id}`
}
