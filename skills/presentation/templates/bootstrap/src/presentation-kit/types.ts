import type { ReactNode } from 'react'

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
  total: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: (props: SceneProps<TPayload>) => ReactNode
  payload: TPayload
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  brand?: ReactNode
  attribution?: ReactNode | false
  designSize?: { width: number; height: number }
}
