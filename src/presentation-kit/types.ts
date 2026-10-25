import type { ComponentType, ReactNode } from 'react'
export type Mode = 'browse' | 'present'
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
export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  brand?: ReactNode
  className?: string
}
