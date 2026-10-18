import type { ComponentType } from 'react'

/** Narration and identity carried by every step. */
export interface StepMeta {
  /** Stable identity; survives reordering. */
  id: string
  /** Section/era label, used by the table of contents. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
}

/**
 * One state of the scene. Adjacent steps that share a `groupKey` and `Scene` keep a single
 * mounted Scene instance; only `payload` changes between them.
 */
export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}

// Steps with different payload types may share one deck; each is still checked against its own Scene.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>

export interface Era {
  label: string
  /** Index of the first step carrying this era label. */
  firstIndex: number
}
