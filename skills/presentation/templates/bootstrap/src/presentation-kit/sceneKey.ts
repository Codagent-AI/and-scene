import type { StepMeta } from './types.ts'

let nextSceneId = 0
const sceneIds = new WeakMap<object, number>()

/** Steps share a mounted scene only when both group key and Scene component match. */
export function sceneKey(step: Pick<StepMeta, 'id'> & { groupKey?: string; Scene: object }): string {
  let id = sceneIds.get(step.Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(step.Scene, id)
  }
  return `${step.groupKey ?? step.id}::${id}`
}
