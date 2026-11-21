import type { ComponentType, ReactNode } from 'react'

export type Mode = 'browse' | 'present'
export type SceneProps<TPayload = undefined> = { payload: TPayload }
export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
}

export type Step<TPayload = undefined> = StepMeta & {
  Scene: Scene<TPayload>
  groupKey?: string
} & (undefined extends TPayload ? { payload?: TPayload } : { payload: TPayload })

export interface PresentationProps<TPayload = undefined> {
  title: string
  steps: readonly Step<TPayload>[]
  initialMode?: Mode
  width?: number
  height?: number
  brand?: ReactNode
  attribution?: ReactNode
}
