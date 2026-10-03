import type { ComponentType, ReactNode } from 'react'

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

export interface Step<TPayload = unknown> extends StepMeta {
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  attribution?: ReactNode | null
  brand?: ReactNode
  className?: string
}
