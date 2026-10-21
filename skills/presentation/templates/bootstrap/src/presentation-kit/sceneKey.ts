const sceneIds = new WeakMap<object, number>()
let nextSceneId = 1
function sceneId(Scene: object): number {
  if (!sceneIds.has(Scene)) sceneIds.set(Scene, nextSceneId++)
  return sceneIds.get(Scene)!
}

/** Steps with the same key keep one mounted scene; any other change remounts. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  // Distinct prefixes keep a group named "x" from colliding with an ungrouped step whose id is "x".
  const identity = step.groupKey === undefined ? `step:${step.id}` : `group:${step.groupKey}`
  return `${sceneId(step.Scene)}:${identity}`
}
