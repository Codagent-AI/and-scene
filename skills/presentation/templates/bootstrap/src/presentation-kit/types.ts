import type { ComponentType } from 'react'
export type Mode = keyof typeof import('./constants').STAGE_LAYOUT
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<TPayload> { payload: TPayload }
export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>
export interface Step<TPayload> extends StepMeta {
  Scene: Scene<TPayload>
  payload: TPayload
  groupKey?: string
}
