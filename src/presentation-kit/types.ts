import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

export interface StepMeta {
  /** Stable identity; never derived from position. */
  id: string
  /** Section/era label used by the table of contents and marker. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode paragraph. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Adjacent steps sharing a group key and Scene keep one mounted scene. */
  groupKey?: string
  /** The diagram state: a scene component plus the payload for this step. */
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}
