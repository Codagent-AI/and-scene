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

/** Steps with the same key share one mounted scene; otherwise the presence host swaps scenes. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  return step.groupKey ? `group:${step.groupKey}:${sceneId(step.Scene)}` : `step:${step.id}`
}
