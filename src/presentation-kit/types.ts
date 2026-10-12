import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
  groupKey?: string
}
export interface SceneProps<TPayload = unknown> { payload: TPayload; step: StepMeta }
export type Scene<TPayload = unknown> = ComponentType<SceneProps<TPayload>>
export interface Step<TPayload = unknown> extends StepMeta {
  Scene: Scene<TPayload>
  payload: TPayload
}
export interface PresentationProps<TPayload = unknown> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  brand?: ReactNode
  className?: string
  style?: CSSProperties
}
