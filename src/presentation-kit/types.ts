import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

/** Narration and identity every step carries. */
export interface StepMeta {
  /** Stable id; survives insertion, removal, and reordering. */
  id: string
  /** Section/era label; consecutive equal labels form one table-of-contents entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** The diagram state for the active step. */
  payload: TPayload
  stepIndex: number
}

/**
 * One named state of the evolving scene. Adjacent steps that share a `groupKey`
 * and the same `Scene` component keep one mounted Scene instance; only `payload`
 * changes, so entities update in place.
 */
export interface Step<TPayload = undefined> extends StepMeta {
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface AttributionOptions {
  label?: string
  href?: string
}
