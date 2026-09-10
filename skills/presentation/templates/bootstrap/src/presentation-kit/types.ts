import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export type SceneProps<TPayload> = {
  payload: TPayload
  step: Step<TPayload>
}

export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>

export type Step<TPayload> = {
  id: string
  era: string
  title: string
  caption: string
  payload: TPayload
  Scene: Scene<TPayload>
  groupKey?: string
}

export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  headerStart?: ReactNode
}
