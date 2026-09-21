import type { CSSProperties, ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export type StepMeta = {
  id: string
  era: string
  title: string
  caption: string
}

export type SceneProps<TPayload> = {
  payload: TPayload
  step: StepMeta
}

export type SceneComponent<TPayload> = ComponentType<SceneProps<TPayload>>

export type Step<TPayload> = StepMeta & {
  groupKey?: string
  Scene: SceneComponent<TPayload>
  payload: TPayload
}

export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  className?: string
  showToc?: boolean
  attribution?: ReactNode
}

export type NodeStyle = CSSProperties & { '--layout-id'?: string }
