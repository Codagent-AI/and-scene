import type { Step } from './types'

const sceneIdentities = new WeakMap<object, number>()
let nextSceneIdentity = 0

function sceneIdentity(Scene: object): number {
  let identity = sceneIdentities.get(Scene)
  if (identity === undefined) {
    nextSceneIdentity += 1
    identity = nextSceneIdentity
    sceneIdentities.set(Scene, identity)
  }
  return identity
}

/** Grouped steps share a key (same group and scene) and keep one instance. */
export function stageKey<TPayload>(step: Step<TPayload>): string {
  return step.groupKey === undefined
    ? `step:${step.id}`
    : `group:${step.groupKey}:scene:${sceneIdentity(step.Scene)}`
}
