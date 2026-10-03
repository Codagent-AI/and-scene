import type { ComponentType } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
  groupKey?: string
}

export interface SceneProps<TPayload> {
  payload: TPayload
  step: StepMeta
  index: number
  total: number
  mode: PresentationMode
}

export interface Step<TPayload> extends StepMeta {
  payload: TPayload
  Scene: ComponentType<SceneProps<TPayload>>
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  attribution?: boolean
  brand?: React.ReactNode
}
