import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity of a step. */
export interface StepMeta {
  /** Stable identity; survives reordering. */
  id: string
  /** Section / era label; consecutive equal labels form one table-of-contents entry. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  step: StepMeta
  /** Zero-based position of the active step. */
  index: number
  payload: TPayload
}

export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: Scene<TPayload>
  /** Adjacent steps with the same groupKey and Scene keep one persistent scene instance. */
  groupKey?: string
  payload?: TPayload
}
