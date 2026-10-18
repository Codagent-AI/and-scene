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

/** Steps with equal keys keep one scene instance; any other change swaps scenes. */
export function sceneKey<TPayload>(step: Step<TPayload>): string {
  return `${step.groupKey ?? `step:${step.id}`}#${sceneId(step.Scene as ComponentType<never>)}`
}
