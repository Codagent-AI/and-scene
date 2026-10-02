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
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  className?: string
  attribution?: ReactNode | null
  brand?: ReactNode
  designWidth?: number
  designHeight?: number
  children?: ReactNode
}

export type StyleProps = {
  className?: string
  style?: CSSProperties
  id?: string
}
