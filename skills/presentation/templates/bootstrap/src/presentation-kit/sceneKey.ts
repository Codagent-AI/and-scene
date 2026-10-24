import type { ComponentType } from 'react'
import type { Step } from './types'

const sceneIds = new WeakMap<ComponentType<never>, number>()
let nextSceneId = 0

function sceneId(Scene: ComponentType<never>): number {
  let id = sceneIds.get(Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(Scene, id)
  }
  return id
}

/**
 * React key for a step's scene. Steps with the same group key and the same
 * scene component share a key, so their scene instance persists.
 */
export function sceneKey<T>(step: Step<T>): string {
  return step.groupKey === undefined
    ? `step:${step.id}`
    : `group:${step.groupKey}:${sceneId(step.Scene as ComponentType<never>)}`
}
