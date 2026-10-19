import type { ComponentType } from 'react'

/** Narration and identity carried by every step. */
export interface StepMeta {
  /** Stable identity; never derived from position. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** Presenter one-liner. */
  title: string
  /** Browse paragraph. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** The diagram state for the active step. */
  payload: TPayload
  step: StepMeta
  /** Zero-based position of the active step. */
  index: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  /** Adjacent steps sharing a group and Scene keep one mounted scene instance. */
  groupKey?: string
}
