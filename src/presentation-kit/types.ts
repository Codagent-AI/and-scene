import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export type StepMeta = {
  id: string
  section: string
  title: string
  caption: string
}

export type SceneProps<TPayload> = {
  payload: TPayload
  step: Step<TPayload>
}

export type SceneComponent<TPayload> = ComponentType<SceneProps<TPayload>>

export type Scene<TPayload> = SceneComponent<TPayload>

export type Step<TPayload> = StepMeta & {
  payload: TPayload
  scene: SceneComponent<TPayload>
  groupKey?: string
}

export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export type FitGeometry = {
  width: number
  height: number
  top: number
  bottom: number
}
