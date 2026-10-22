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

/**
 * Identity of the mounted scene. Steps sharing both the Scene component and the
 * group key share a key, so one instance persists and only its payload changes.
 */
export function sceneKey(step: { Scene: object; groupKey?: string; id: string }): string {
  return `${sceneId(step.Scene)}:${step.groupKey ?? `step:${step.id}`}`
}
