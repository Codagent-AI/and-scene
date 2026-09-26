import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type SceneProps<TPayload> = { payload: TPayload; step: number }
export type Step<TPayload = unknown> = {
  id: string
  era: string
  title: string
  caption: string
  scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}
export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: 'present' | 'browse'
  designSize?: { width: number; height: number }
  className?: string
  style?: CSSProperties
  attribution?: ReactNode | false
}
