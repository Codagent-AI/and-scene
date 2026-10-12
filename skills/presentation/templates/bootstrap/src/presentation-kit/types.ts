import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
  groupKey?: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  step: StepMeta
  index: number
}

export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: Scene<TPayload>
  payload: TPayload
}

export interface AttributionOptions {
  href?: string
  label?: string
}

export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  attribution?: AttributionOptions
  brand?: ReactNode
}
