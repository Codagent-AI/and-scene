import type { Step } from './types'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

function sceneId(Scene: object): number {
  let id = sceneIds.get(Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(Scene, id)
  }
  return id
}

/** Steps with equal keys share one mounted Scene instance. */
export function sceneKey<T>(step: Pick<Step<T>, 'id' | 'groupKey' | 'Scene'>): string {
  const scene = sceneId(step.Scene)
  return step.groupKey !== undefined ? `group:${step.groupKey}:${scene}` : `step:${step.id}:${scene}`
}
