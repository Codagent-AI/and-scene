import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

/** Narration and identity shared by every step. */
export interface StepMeta {
  /** Stable identity; never derived from position. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  step: StepMeta
  index: number
  mode: Mode
}

/**
 * One named state of the scene. Steps that share a `groupKey` and the same
 * `Scene` component keep one mounted instance; only `payload` changes.
 */
export interface Step<TPayload = undefined> extends StepMeta {
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface Canvas {
  width: number
  height: number
}
