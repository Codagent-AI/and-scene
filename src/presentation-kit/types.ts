import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'present' | 'browse'

export interface SceneProps<TPayload> {
  payload: TPayload
  step: StepMeta
}

export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
  number: number
}

export interface Step<TPayload = unknown> {
  id: string
  era: string
  title: string
  caption: string
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  attribution?: ReactNode | false
  className?: string
  style?: CSSProperties
}
