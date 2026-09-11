import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export type StepMeta = {
  id: string
  era: string
  title: string
  caption: string
  index: number
}

export type SceneProps<TPayload> = {
  payload: TPayload
  step: StepMeta
}

export type SceneComponent<TPayload> = ComponentType<SceneProps<TPayload>>

export type Step<TPayload> = Omit<StepMeta, 'index'> & {
  index?: number
  groupKey?: string
  Scene: SceneComponent<TPayload>
  payload: TPayload
}

export type IndexedStep<TPayload> = Omit<Step<TPayload>, 'index'> & Pick<StepMeta, 'index'>

export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  brand?: ReactNode
  attribution?: ReactNode | false
  className?: string
  style?: CSSProperties
}
