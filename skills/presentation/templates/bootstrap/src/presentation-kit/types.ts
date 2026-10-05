import type { ComponentType, CSSProperties } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
  /** Shared by adjacent states of one evolving scene. */
  groupKey?: string
}

export interface SceneProps<TPayload> {
  payload: TPayload
  step: StepMeta
  stepIndex: number
  className?: string
}

export interface Step<TPayload> extends StepMeta {
  payload: TPayload
  Scene: ComponentType<SceneProps<TPayload>>
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  designSize?: { width: number; height: number }
  attribution?: { label?: string; href?: string; hidden?: boolean }
  className?: string
  style?: CSSProperties
}
