import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export type SceneProps<TPayload> = {
  payload: TPayload
  step: Step<TPayload>
  mode: PresentationMode
}

export type Step<TPayload> = {
  id: string
  era: string
  title: string
  caption: string
  payload: TPayload
  Scene: ComponentType<SceneProps<TPayload>>
  groupKey?: string
}

export type Scene = ComponentType<SceneProps<unknown>>

export type StageLayout = {
  header: number
  footer: number
  padding: number
}

export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  children?: ReactNode
  className?: string
  style?: CSSProperties
}
