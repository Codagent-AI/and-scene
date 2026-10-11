import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export type SceneProps<TPayload> = { payload: TPayload }
export type Scene<TPayload = unknown> = ComponentType<SceneProps<TPayload>>

export type StepMeta = {
  id: string
  era: string
  title: string
  caption: string
}

export type Step<TPayload = unknown> = StepMeta & {
  diagram: {
    scene: Scene<TPayload>
    groupKey?: string
    payload: TPayload
  }
}

export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  initialMode?: PresentationMode
  title: string
  brand?: ReactNode
  designSize?: { width: number; height: number }
}
