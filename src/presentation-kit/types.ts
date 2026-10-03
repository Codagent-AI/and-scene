import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<TPayload = undefined> { payload: TPayload; step: StepMeta; index: number; total: number }
export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  /** Adjacent steps with this key keep one scene instance mounted. */
  groupKey?: string
}
export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  designWidth?: number
  designHeight?: number
  renderHeaderBrand?: ReactNode
  className?: string
  style?: CSSProperties
}
