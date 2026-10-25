import type { AnyStep } from './types.ts'

const sceneIds = new WeakMap<object, number>()
let nextId = 1
function sceneId(Scene: object): number {
  let id = sceneIds.get(Scene)
  if (id === undefined) {
    id = nextId++
    sceneIds.set(Scene, id)
  }
  return id
}

/** Steps sharing a groupKey and Scene share a key, so the scene instance persists. */
export function sceneKey(step: AnyStep): string {
  return step.groupKey ? `group:${step.groupKey}:${sceneId(step.Scene)}` : `step:${step.id}`
}
