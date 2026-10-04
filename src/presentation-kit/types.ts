import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export type StepMeta = { id: string; era: string; title: string; caption: string }
export type SceneProps<TPayload> = { payload: TPayload }
export type SceneComponent<TPayload> = ComponentType<SceneProps<TPayload>>
export type Step<TPayload = unknown> = StepMeta & {
  Scene: SceneComponent<TPayload>
  payload: TPayload
  groupKey?: string
}
export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  children?: ReactNode
  brand?: ReactNode
  attribution?: ReactNode
}
