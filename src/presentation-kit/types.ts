import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type StepMeta = {
  id: string
  era: string
  title: string
  caption: string
  groupKey?: string
}

export type SceneProps<TPayload> = { payload: TPayload; step: StepMeta; index: number }
export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>
export type Step<TPayload = undefined> = StepMeta & {
  scene: Scene<TPayload>
  payload: TPayload
}
export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: 'browse' | 'present'
  designSize?: { width: number; height: number }
  branding?: ReactNode
  attribution?: ReactNode | false
  className?: string
  style?: CSSProperties
}
