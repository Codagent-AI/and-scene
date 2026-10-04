import type { ComponentType } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
  groupKey?: string
}

export interface SceneProps<TPayload> {
  payload: TPayload
  step: StepMeta
  index: number
}

export interface Step<TPayload = unknown> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  designSize?: { width: number; height: number }
  attribution?: React.ReactNode | false
}

export type PresentationComponent = <TPayload>(props: PresentationProps<TPayload>) => React.ReactElement
