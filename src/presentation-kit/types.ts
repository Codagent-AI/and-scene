import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

export interface StepMeta {
  /** Stable identity; survives insertion, removal and reordering. */
  id: string
  /** Section/era label, used to group the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = unknown> {
  payload: TPayload
  stepIndex: number
}

export interface Step<TPayload = unknown> extends StepMeta {
  /** Adjacent steps sharing a groupKey and Scene keep one mounted scene instance. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}
