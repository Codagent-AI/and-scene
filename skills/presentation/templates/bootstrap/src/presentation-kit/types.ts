import type { ComponentType } from 'react'

export type PresentationMode = 'browse' | 'present'

export type SceneProps<TPayload> = {
  payload: TPayload
  step: Step<TPayload>
  stepIndex: number
  stepCount: number
}

export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>

export type Step<TPayload = unknown> = {
  id: string
  era: string
  title: string
  caption: string
  Scene: Scene<TPayload>
  payload: TPayload
  groupKey?: string
}

export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
}
