import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

export interface StepMeta {
  /** Stable identity; the on-screen number is derived from position. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  step: StepMeta
  index: number
}

type PayloadField<TPayload> = undefined extends TPayload
  ? { payload?: TPayload }
  : { payload: TPayload }

/**
 * A named state of the evolving scene. Adjacent steps with the same `groupKey`
 * and `Scene` share one mounted scene instance; only `payload` changes.
 */
export type Step<TPayload = undefined> = StepMeta &
  PayloadField<TPayload> & {
    Scene: ComponentType<SceneProps<TPayload>>
    groupKey?: string
  }

export interface Canvas {
  width: number
  height: number
}

export interface AttributionOptions {
  label?: string
  href?: string
}
