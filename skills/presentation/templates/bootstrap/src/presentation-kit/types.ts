import type { ComponentType } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  stepIndex: number
}

export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

export type Step<TPayload = undefined> = StepMeta & {
  Scene: Scene<TPayload>
  groupKey?: string
  payload: TPayload
}
