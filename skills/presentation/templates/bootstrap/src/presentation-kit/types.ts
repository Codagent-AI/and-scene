import type { ComponentType } from 'react'
export type Mode = 'browse' | 'present'
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<T = undefined> { payload: T }
export type Scene<T = undefined> = ComponentType<SceneProps<T>>
export interface Step<T = undefined> extends StepMeta { Scene: Scene<T>; payload: T; groupKey?: string }
export function validateSteps<T>(steps: readonly Step<T>[]) {
  if (!steps.length) throw new Error('A presentation requires at least one step')
  const ids = new Set<string>()
  for (const step of steps) {
    if (!step.id || !step.era || !step.title || !step.caption || !step.Scene) throw new Error('Incomplete step metadata')
    if (ids.has(step.id)) throw new Error(`Duplicate step id: ${step.id}`)
    ids.add(step.id)
  }
}
