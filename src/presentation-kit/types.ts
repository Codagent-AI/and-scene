import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity every step carries. */
export interface StepMeta {
  /** Stable identity; survives insertion, removal, and reordering. */
  id: string
  /** Section/era label, used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode caption (a paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** The active step's diagram state. */
  payload: TPayload
  /** Position of the active step. */
  index: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Adjacent steps sharing a groupKey and Scene keep one scene instance. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface Canvas {
  width: number
  height: number
}
