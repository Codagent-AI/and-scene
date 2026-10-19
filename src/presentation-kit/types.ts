import type { ComponentType } from 'react'

/** Narration and identity every step carries. */
export interface StepMeta {
  /** Stable identity; survives reordering. */
  id: string
  /** Section / era label used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  step: StepMeta
  index: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Adjacent steps with the same group key and Scene share one scene instance. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  /** Diagram state shown while this step is active. */
  payload: TPayload
}
