import type { ComponentType } from 'react'
import type { Step } from './types'

const sceneIds = new WeakMap<ComponentType<never>, number>()
let nextSceneId = 1

/** Steps with the same key share one mounted scene instance. */
export function sceneKey<TPayload>(step: Step<TPayload>): string {
  if (step.groupKey === undefined) return `step:${step.id}`
  const scene = step.Scene as ComponentType<never>
  let sceneId = sceneIds.get(scene)
  if (sceneId === undefined) {
    sceneId = nextSceneId++
    sceneIds.set(scene, sceneId)
  }
  return `group:${step.groupKey}:${sceneId}`
}
