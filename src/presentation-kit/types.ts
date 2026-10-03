import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
}
export interface SceneProps<TPayload> { payload: TPayload }
export interface Step<TPayload = undefined> extends StepMeta {
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}
export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  designSize?: { width: number; height: number }
  brand?: ReactNode
}
