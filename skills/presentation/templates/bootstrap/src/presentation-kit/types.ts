import type { ComponentType } from 'react'
export type Mode = 'browse' | 'present'
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<TPayload> { payload: TPayload }
export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>
export interface Step<TPayload = undefined> extends StepMeta {
  Scene: Scene<TPayload>
  payload: TPayload
  groupKey?: string
}
export function validateSteps<T>(steps: readonly Step<T>[]) {
  if (!steps.length) throw new Error('A presentation needs at least one step')
  const ids = new Set<string>()
  for (const step of steps) {
    if (![step.id, step.era, step.title, step.caption].every(s => typeof s === 'string' && s.trim()))
      throw new Error('Every step needs id, era, title and caption')
    if (ids.has(step.id)) throw new Error(`Duplicate step id: ${step.id}`)
    ids.add(step.id)
    if (!step.Scene) throw new Error(`Missing scene: ${step.id}`)
  }
}
