import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
}
export interface SceneProps<TPayload = undefined> { payload: TPayload; step: StepMeta; index: number }
export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>
export type Step<TPayload = undefined> = StepMeta & {
  groupKey?: string
  Scene: Scene<TPayload>
  content?: ReactNode
} & (undefined extends TPayload ? { payload?: TPayload } : { payload: TPayload })
