import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

/** Narration and identity every step carries. */
export interface StepMeta {
  /** Stable identity; never derived from position. */
  id: string
  /** Section / era label; the table of contents lists distinct eras. */
  era: string
  /** Presenter title (one line). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** Diagram state shown while this step is active. */
  payload: TPayload
  step: StepMeta
  /** Zero-based position of the active step. */
  index: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  /**
   * Steps that share a group key and the same Scene component keep one scene
   * instance alive; only the payload changes.
   */
  groupKey?: string
}
