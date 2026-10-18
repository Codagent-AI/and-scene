import type { Step } from './types'

const ids = new WeakMap<object, number>()
let nextId = 0

/** Host key: steps with the same group and Scene component share one mounted Scene. */
export function sceneKey<TPayload>(step: Step<TPayload>): string {
  let id = ids.get(step.Scene)
  if (id === undefined) ids.set(step.Scene, (id = nextId++))
  return `${step.groupKey ?? step.id}:${id}`
}
