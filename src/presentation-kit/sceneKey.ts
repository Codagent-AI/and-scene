import type { ComponentType } from 'react'
import type { AnyStep, SceneProps } from './types.ts'

const sceneIds = new WeakMap<ComponentType<SceneProps>, number>()
let nextSceneId = 0
function sceneId(Scene: ComponentType<SceneProps>) {
  if (!sceneIds.has(Scene)) sceneIds.set(Scene, ++nextSceneId)
  return sceneIds.get(Scene)
}

/** Steps with the same group and Scene share a key, so the scene instance persists. */
export const sceneKey = (step: AnyStep) => `${step.groupKey ?? step.id}:${sceneId(step.Scene)}`
