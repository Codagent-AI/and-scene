const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

/**
 * Steps with the same groupKey and Scene share a key, so the scene instance persists
 * and only its payload changes. Any other change remounts and cross-fades.
 */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  if (!step.groupKey) return `step:${step.id}`
  let id = sceneIds.get(step.Scene)
  if (id === undefined) sceneIds.set(step.Scene, (id = nextSceneId++))
  return `group:${step.groupKey}:${id}`
}
