import type { Step } from './types.ts'

const componentIds = new WeakMap<object, number>()
let nextComponentId = 1

function componentId(component: object): number {
  let id = componentIds.get(component)
  if (id === undefined) {
    id = nextComponentId++
    componentIds.set(component, id)
  }
  return id
}

/** Steps with the same group key and Scene component share one mounted instance. */
export function sceneKey<TPayload>(step: Step<TPayload>): string {
  return step.groupKey
    ? `group:${step.groupKey}:${componentId(step.Scene)}`
    : `step:${step.id}`
}
