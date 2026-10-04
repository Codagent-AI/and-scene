import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
}

export interface SceneProps<TPayload> {
  payload: TPayload
  step: StepMeta
  index: number
  total: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  payload: TPayload
  Scene: ComponentType<SceneProps<TPayload>>
  /** Adjacent steps with the same group key and Scene retain the scene instance. */
  groupKey?: string
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  design?: { width: number; height: number }
  attribution?: ReactNode | false
  brand?: ReactNode
  className?: string
  style?: CSSProperties
}
