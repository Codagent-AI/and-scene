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

export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>

export interface Step<TPayload = unknown> extends StepMeta {
  payload: TPayload
  Scene: Scene<TPayload>
  groupKey?: string
}

export interface NodeProps {
  children?: ReactNode
  layoutId?: string
  className?: string
  style?: CSSProperties
  [key: `data-${string}`]: string | undefined
}
