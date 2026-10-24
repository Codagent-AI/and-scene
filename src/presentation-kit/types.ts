import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

export interface SceneProps<TPayload = undefined> {
  /** The active step's diagram state. */
  payload: TPayload
  stepId: string
  stepIndex: number
}

export interface StepMeta {
  /** Stable identity; never derived from position. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
  /** Adjacent steps sharing a groupKey and Scene keep one mounted scene instance. */
  groupKey?: string
}

export interface Step<TPayload = undefined> extends StepMeta {
  payload: TPayload
  Scene: ComponentType<SceneProps<TPayload>>
}

export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title?: string
  initialMode?: Mode
  /** Optional host brand rendered in the top-left header slot. */
  brand?: React.ReactNode
  /** Pass false to remove the attribution link, or override its label/href. */
  attribution?: false | { label?: string; href?: string }
  className?: string
}
