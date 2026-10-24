import type { ComponentType } from 'react'

/** Props every scene component receives for the active step. */
export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

/**
 * One named state of the evolving scene. The on-screen step number is derived
 * from the step's position in the array, never stored.
 */
export interface Step<TPayload = undefined> {
  /** Stable identity, unique within a presentation. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
  /** Diagram state shown while this step is active. */
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  /**
   * Adjacent steps sharing a group key and the same `Scene` keep one mounted
   * scene instance; only `payload` changes between them.
   */
  groupKey?: string
}

export type PresentationMode = 'present' | 'browse'

export interface CanvasSize {
  width: number
  height: number
}
