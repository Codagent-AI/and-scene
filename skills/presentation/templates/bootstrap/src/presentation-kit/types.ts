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
}

export interface Step<TPayload = unknown> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  /** Adjacent steps with the same key and Scene retain one mounted scene instance. */
  groupKey?: string
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  className?: string
  designWidth?: number
  designHeight?: number
  attribution?: ReactNode | false
}

export interface PrimitiveProps {
  id?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}
