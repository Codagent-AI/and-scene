import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'
export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
}
export interface SceneProps<TPayload> { payload: TPayload }
export interface Step<TPayload = unknown> extends StepMeta {
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}
export interface SceneDefinition<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  designSize?: { width: number; height: number }
}
