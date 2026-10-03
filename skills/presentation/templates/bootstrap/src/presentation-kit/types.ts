import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type StepMeta = {
  id: string
  era: string
  title: string
  caption: string
  scene: ComponentType<SceneProps<unknown>>
  groupKey?: string
  payload?: unknown
}

export type SceneProps<TPayload = unknown> = {
  step: Step<TPayload>
  payload: TPayload
  index: number
  total: number
}

export type Step<TPayload = unknown> = Omit<StepMeta, 'scene' | 'payload'> & {
  scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export type PresentationProps<TPayload = unknown> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: 'browse' | 'present'
  attribution?: ReactNode
  designWidth?: number
  designHeight?: number
  className?: string
  style?: CSSProperties
}
