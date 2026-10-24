import type { ComponentType } from 'react'
import type { Step } from './types'

const sceneIds = new WeakMap<ComponentType<never>, number>()
let nextSceneId = 0

/** Scene host identity: equal for adjacent steps sharing group and Scene. */
export function sceneKey<P>(step: Step<P>): string {
  const scene = step.Scene as ComponentType<never>
  let id = sceneIds.get(scene)
  if (id === undefined) sceneIds.set(scene, (id = nextSceneId++))
  return `${step.groupKey ?? step.id}::${id}`
}
