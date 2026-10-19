const sceneIds = new WeakMap<object, number>()
let nextId = 1

/** Steps with equal keys (same groupKey and same Scene) share one scene instance. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  let id = sceneIds.get(step.Scene)
  if (id === undefined) {
    id = nextId++
    sceneIds.set(step.Scene, id)
  }
  return `${step.groupKey ?? step.id}:${id}`
}
