import { createElement, type ComponentType, type ReactElement } from 'react'

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

/**
 * A step with its scene and payload bound together and their types erased, so a
 * presentation can hold steps with different payload types. The only way to make
 * one is `defineStep`, which checks `payload` against the scene's payload type.
 */
export interface AnyStep extends StepMeta {
  groupKey?: string
  /** Renders the bound scene for the active step. */
  render: (stepIndex: number) => ReactElement
}

/** Binds a step's `Scene` to its `payload` (type-checked) and returns a step `<Presentation>` accepts without casts. */
export function defineStep<TPayload>(step: Step<TPayload>): AnyStep {
  const { Scene, payload, ...rest } = step
  return { ...rest, render: (stepIndex) => createElement(Scene, { payload, stepIndex }) }
}
