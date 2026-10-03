import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<TPayload> { payload: TPayload; step: StepMeta; index: number }
export interface Step<TPayload> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}
export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  designWidth?: number
  designHeight?: number
  className?: string
  style?: CSSProperties
  branding?: ReactNode
  attribution?: ReactNode | false
}
