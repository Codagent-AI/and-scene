import type { AnyStep } from './types'

let nextSceneId = 0
const sceneIds = new WeakMap<object, number>()
function sceneId(scene: object): number {
  let id = sceneIds.get(scene)
  if (id === undefined) {
    id = ++nextSceneId
    sceneIds.set(scene, id)
  }
  return id
}

/** Steps with equal keys share one persistent scene instance. */
export function sceneKey(step: AnyStep): string {
  return step.groupKey ? `group:${step.groupKey}:${sceneId(step.Scene)}` : `step:${step.id}`
}
