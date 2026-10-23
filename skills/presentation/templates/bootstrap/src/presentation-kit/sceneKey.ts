import type { Step } from './types'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

/** Steps with equal keys share one mounted scene instance. */
export function sceneKey(step: Pick<Step, 'id' | 'groupKey'> & { Scene: object }): string {
  if (step.groupKey === undefined) return `step:${step.id}`
  let id = sceneIds.get(step.Scene)
  if (id === undefined) sceneIds.set(step.Scene, (id = nextSceneId++))
  return `group:${step.groupKey}:${id}`
}
