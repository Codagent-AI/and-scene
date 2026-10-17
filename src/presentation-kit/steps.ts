import { createElement } from 'react'
import type { Step, SceneStep } from './types'

const sceneIds = new WeakMap<object, number>()
let lastSceneId = 0

function sceneIdOf(scene: object): number {
  let id = sceneIds.get(scene)
  if (id === undefined) {
    id = ++lastSceneId
    sceneIds.set(scene, id)
  }
  return id
}

/**
 * Binds a step's payload type to its scene so a presentation can hold steps with
 * different payload types without casts.
 */
export function defineStep<TPayload>(step: Step<TPayload>): SceneStep {
  const { Scene, payload, groupKey, ...meta } = step
  return {
    ...meta,
    groupKey,
    sceneId: sceneIdOf(Scene),
    render: () => createElement(Scene, { payload }),
  }
}

/** Steps with equal host keys share one mounted scene instance. */
export function hostKey(step: SceneStep): string {
  return step.groupKey === undefined
    ? `step:${step.id}`
    : `group:${step.groupKey}:${step.sceneId}`
}
