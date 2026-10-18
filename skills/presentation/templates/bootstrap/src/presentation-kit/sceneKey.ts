import type { Step } from './types'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

function sceneId(Scene: object): number {
  let id = sceneIds.get(Scene)
  if (id === undefined) sceneIds.set(Scene, (id = nextSceneId++))
  return id
}

/**
 * Steps in the same group (same groupKey and Scene component) share a key, so the
 * scene instance persists and only its payload changes. Anything else cross-fades.
 */
export function sceneKey<TPayload>(step: Step<TPayload>): string {
  return step.groupKey !== undefined
    ? `group:${step.groupKey}:${sceneId(step.Scene)}`
    : `step:${step.id}`
}
