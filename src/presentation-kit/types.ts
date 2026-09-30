import type { ComponentType } from 'react'

export type PresentationMode = 'present' | 'browse'

export interface SceneProps<TPayload> {
  payload: TPayload
  active: boolean
}

export interface Step<TPayload = unknown> {
  id: string
  era: string
  title: string
  caption: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}

export interface PresentationProps<TPayload = unknown> {
  steps: Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
}
