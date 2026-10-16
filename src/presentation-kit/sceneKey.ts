import type { AnyStep } from './types'

const sceneIds = new WeakMap<object, number>()
let nextId = 0

/**
 * Key for the Stage's presence child. Steps sharing `groupKey` and the same
 * Scene component share a key (instance persists); all others get their own.
 */
export function stageKey(step: AnyStep): string {
  if (step.groupKey === undefined) return `step:${step.id}`
  let id = sceneIds.get(step.Scene)
  if (id === undefined) sceneIds.set(step.Scene, (id = nextId++))
  return `group:${step.groupKey}:${id}`
}
