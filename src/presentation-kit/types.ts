import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

/** Narration and identity every step carries. */
export interface StepMeta {
  /** Stable identity; the on-screen number is derived from position. */
  id: string
  /** Section/era label; steps sharing an era are grouped in the table of contents. */
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
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Adjacent steps with the same groupKey and Scene keep one scene instance. */
  groupKey?: string
  payload: TPayload
  Scene: ComponentType<SceneProps<TPayload>>
}
