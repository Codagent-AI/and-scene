const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneId(scene: object): number {
  let id = sceneIds.get(scene)
  if (id === undefined) sceneIds.set(scene, (id = nextSceneId++))
  return id
}

/** Steps share one mounted scene only with the same group key and Scene component. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  return step.groupKey === undefined
    ? `step:${step.id}`
    : `group:${step.groupKey}:${sceneId(step.Scene)}`
}
