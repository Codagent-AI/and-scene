import type { ComponentType } from 'react'

export type PresentationMode = 'browse' | 'present'

export type SceneProps<TPayload> = {
  payload: TPayload
  step: Step<TPayload>
  index: number
}

export type Step<TPayload> = {
  id: string
  section: string
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
  className?: string
  showAttribution?: boolean
}
