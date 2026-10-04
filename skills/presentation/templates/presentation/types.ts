import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface StepMeta {
  id: string
  section: string
  title: string
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  step: StepMeta
  payload: TPayload
  index: number
  total: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}

export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  designWidth?: number
  designHeight?: number
  className?: string
  attribution?: ReactNode | false
  brand?: ReactNode
  style?: CSSProperties
}

export type PresentationComponent<TPayload = undefined> = ComponentType<PresentationProps<TPayload>>
