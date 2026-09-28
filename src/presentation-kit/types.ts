import type { ComponentType, CSSProperties } from 'react'

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
}

export interface Step<TPayload = unknown> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  designSize?: { width: number; height: number }
  className?: string
  renderBrand?: React.ReactNode
  attribution?: React.ReactNode
}

export type NodeProps = {
  id: string
  className?: string
  style?: CSSProperties
  children?: React.ReactNode
  [key: `data-${string}`]: unknown
}
