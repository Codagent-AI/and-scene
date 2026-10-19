let nextSceneId = 0
const sceneIds = new WeakMap<object, number>()
function sceneId(scene: object): number {
  let id = sceneIds.get(scene)
  if (id === undefined) sceneIds.set(scene, (id = nextSceneId++))
  return id
}

/** Steps with the same group and Scene share a key, so one instance persists. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  return step.groupKey ? `group:${step.groupKey}:${sceneId(step.Scene)}` : `step:${step.id}`
}
