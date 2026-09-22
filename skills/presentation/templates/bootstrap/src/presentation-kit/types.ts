import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export type SceneProps<TPayload> = { payload: TPayload }

export type Step<TPayload = unknown> = {
  id: string
  era: string
  title: string
  caption: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}

export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  branding?: ReactNode
  className?: string
}
