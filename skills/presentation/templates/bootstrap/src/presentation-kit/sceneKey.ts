import type { Step } from './types.ts'

let nextSceneId = 0
const sceneIds = new WeakMap<object, number>()

/**
 * Identity of the mounted scene instance. Steps persist only when they share
 * both a group key and the same Scene component; anything else remounts.
 */
export function sceneKey(step: Pick<Step<never>, 'id' | 'groupKey'> & { Scene: object }): string {
  if (!step.groupKey) return `step:${step.id}`
  let id = sceneIds.get(step.Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(step.Scene, id)
  }
  return `group:${step.groupKey}:${id}`
}
