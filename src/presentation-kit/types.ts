import type { ComponentType, CSSProperties, ReactNode } from 'react'

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

export interface Step<TPayload> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  className?: string
  renderBrand?: ReactNode
  attribution?: ReactNode
  designSize?: { width: number; height: number }
}

export interface PrimitiveProps {
  id?: string
  className?: string
  children?: ReactNode
  style?: CSSProperties
  'data-testid'?: string
}

export interface EntityPrimitiveProps extends Omit<PrimitiveProps, 'id'> {
  id: string
}
