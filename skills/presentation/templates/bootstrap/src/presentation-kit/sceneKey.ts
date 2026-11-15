import type { Step } from './types'
const componentIds = new WeakMap<object, number>()
let nextId = 0
export function sceneKey<T>(step: Step<T>) {
  if (!componentIds.has(step.Scene)) componentIds.set(step.Scene, nextId++)
  return `${step.groupKey ?? step.id}:${componentIds.get(step.Scene)}`
}
