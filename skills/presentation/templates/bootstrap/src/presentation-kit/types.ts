import type { CSSProperties, ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export type StepMeta = {
  id: string
  section: string
  title: string
  caption: string
}
export type SceneProps<TPayload> = { payload: TPayload; step: StepMeta; index: number; total: number }
export type Scene<TPayload = unknown> = ComponentType<SceneProps<TPayload>>
export type Step<TPayload = unknown> = StepMeta & {
  scene: Scene<TPayload>
  payload: TPayload
  /** Adjacent steps with the same key and Scene component retain the scene instance. */
  groupKey?: string
  /** Optional content rendered outside the diagram canvas. */
  overlay?: ReactNode
}
export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  designWidth?: number
  designHeight?: number
  brand?: ReactNode
  attribution?: ReactNode | false
  className?: string
  onStepChange?: (index: number) => void
}
export type StyleProps = { className?: string; style?: CSSProperties; id?: string; 'data-testid'?: string }
