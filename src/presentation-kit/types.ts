import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface SceneProps<TPayload> {
  payload: TPayload
  step: Step<TPayload>
  index: number
}

export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>

export interface Step<TPayload> {
  id: string
  era: string
  title: string
  caption: string
  Scene: Scene<TPayload>
  payload: TPayload
  groupKey?: string
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  children?: ReactNode
}
