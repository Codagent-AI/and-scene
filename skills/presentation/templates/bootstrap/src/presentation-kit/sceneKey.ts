import type { Scene, Step } from './types'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 1

function sceneId(scene: Scene<never> | Scene<unknown>): number {
  let id = sceneIds.get(scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(scene, id)
  }
  return id
}

/** Steps sharing a groupKey and Scene share a key, so the scene instance persists. */
export function sceneKey(step: Step<unknown>): string {
  return `${step.groupKey ?? step.id}#${sceneId(step.Scene)}`
}
