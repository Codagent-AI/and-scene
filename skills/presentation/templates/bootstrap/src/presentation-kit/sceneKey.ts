const sceneIds = new WeakMap<object, number>()
let nextSceneId = 1
function sceneId(Scene: object): number {
  if (!sceneIds.has(Scene)) sceneIds.set(Scene, nextSceneId++)
  return sceneIds.get(Scene)!
}

/** Steps with the same key keep one mounted scene; any other change remounts. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  return `${sceneId(step.Scene)}:${step.groupKey ?? `step:${step.id}`}`
}
