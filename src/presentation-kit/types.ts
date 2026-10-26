import type { ComponentType, CSSProperties, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface SceneProps<TPayload> {
  payload: TPayload
  step: Step<TPayload>
  stepIndex: number
  stepCount: number
}

export interface Step<TPayload> {
  id: string
  era: string
  title: string
  caption: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  /** Keeps consecutive states of the same scene mounted in place. */
  groupKey?: string
}

export interface SceneStyleProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export type NonEmptySteps<TPayload> = readonly [Step<TPayload>, ...Step<TPayload>[]]

export interface PresentationProps<TPayload> {
  steps: NonEmptySteps<TPayload>
  title: string
  initialMode?: PresentationMode
  className?: string
  attributionHref?: string
}
