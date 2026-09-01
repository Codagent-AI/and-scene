import type { ComponentType } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface SceneProps<TPayload> {
  payload: TPayload
  step: Step<TPayload>
  stepIndex: number
}

export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>

export interface Step<TPayload> {
  /** A stable, presentation-local identity used by navigation and automation. */
  id: string
  /** The section label used by the table of contents and presenter marker. */
  era: string
  /** Concise narration displayed during presentation mode. */
  title: string
  /** Longer narration displayed while browsing. */
  caption: string
  /** Adjacent matching keys keep their scene instance mounted. */
  groupKey?: string
  Scene: Scene<TPayload>
  payload: TPayload
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
}
