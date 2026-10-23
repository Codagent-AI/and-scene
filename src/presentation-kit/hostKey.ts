import type { ComponentType } from 'react'
import type { Step } from './types'

const sceneIds = new WeakMap<ComponentType<never>, number>()
let nextSceneId = 0

/** Steps with the same host key share one mounted Scene; any other change swaps hosts with a cross-fade. */
export function hostKey<TPayload>(step: Pick<Step<TPayload>, "id" | "groupKey" | "Scene">): string {
  if (step.groupKey === undefined) return `step:${step.id}`
  const scene = step.Scene as ComponentType<never>
  let id = sceneIds.get(scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(scene, id)
  }
  return `group:${step.groupKey}:${id}`
}
