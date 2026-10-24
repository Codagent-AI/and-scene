const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneId(Scene: object) {
  let id = sceneIds.get(Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(Scene, id)
  }
  return id
}

/** Steps with the same group and Scene share one instance; anything else swaps scenes. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }) {
  return `${step.groupKey ?? step.id}:${sceneId(step.Scene)}`
}
