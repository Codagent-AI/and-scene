import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

/** Narration and identity carried by every step. */
export interface StepMeta {
  /** Stable identity; survives reordering. */
  id: string
  /** Section / era label used by the table of contents. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  /**
   * Adjacent steps sharing a `groupKey` (and `Scene`) keep one mounted scene
   * instance; only `payload` changes, so entities update in place.
   */
  groupKey?: string
  payload: TPayload
}

/** Any step, whatever its payload type. Lets `<Presentation>` accept typed steps without casts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>

/** Identity helper that infers a step's payload type from its `Scene`. */
export function defineStep<TPayload>(step: Step<TPayload>): Step<TPayload> {
  return step
}
