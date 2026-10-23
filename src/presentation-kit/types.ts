import type { ComponentType } from 'react'

export interface SceneProps<TPayload = unknown> {
  payload: TPayload
}

/** One named state of the evolving scene. */
export interface Step<TPayload = unknown> {
  /** Stable identity; the on-screen number is derived from position. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
  /** Scene component; adjacent steps sharing `groupKey` and `Scene` keep one instance. */
  Scene: ComponentType<SceneProps<TPayload>>
  /** Diagram state shown while the step is active. */
  payload: TPayload
  groupKey?: string
}

export interface Canvas {
  width: number
  height: number
}
