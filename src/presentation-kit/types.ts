import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
}
export interface SceneProps<TPayload = undefined> { payload: TPayload; step: StepMeta; index: number }
export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>
export interface Step<TPayload = undefined> extends StepMeta {
  groupKey?: string
  payload?: TPayload
  Scene: Scene<TPayload>
  content?: ReactNode
}
