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

/** Same group + same Scene share a key (instance persists); otherwise one per step. */
export function hostKey(step: { id: string; groupKey?: string; Scene: object }): string {
  return step.groupKey === undefined
    ? `step:${step.id}`
    : `group:${step.groupKey}:${sceneId(step.Scene)}`
}
