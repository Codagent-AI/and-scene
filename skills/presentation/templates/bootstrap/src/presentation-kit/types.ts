import type { ComponentType } from 'react'
export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
}
export interface SceneProps<TPayload = undefined> { payload: TPayload }
export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>
export interface Step<TPayload = undefined> extends StepMeta {
  Scene: Scene<TPayload>
  payload: TPayload
  groupKey?: string
}
export type Mode = 'browse' | 'present'
export function validateSteps<T>(steps: readonly Step<T>[]): void {
  if (!steps.length) throw new Error('A presentation needs at least one step')
  const ids = new Set<string>()
  for (const step of steps) {
    if (!step.id || !step.era || !step.title || !step.caption || !step.Scene) {
      throw new Error(`Incomplete step: ${step.id || '(missing id)'}`)
    }
    if (ids.has(step.id)) throw new Error(`Duplicate step id: ${step.id}`)
    ids.add(step.id)
  }
}
