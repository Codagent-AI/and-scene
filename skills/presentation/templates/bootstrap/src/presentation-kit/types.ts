import type { ComponentType } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface StepMeta {
  /** Stable identity; survives reordering and is used for keys and tooling. */
  id: string
  /** Section / era label; drives the table of contents. */
  era: string
  /** Presenter one-liner shown in present mode. */
  title: string
  /** Browse-mode paragraph. */
  caption: string
}

export interface SceneProps<TPayload> {
  payload: TPayload
}

/** A scene component renders one diagram state from its payload. */
export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>

export interface Step<TPayload> extends StepMeta {
  /**
   * Adjacent steps with the same `groupKey` and `scene` share one mounted scene
   * instance: only `payload` changes between them, so entities morph in place.
   */
  groupKey?: string
  scene: Scene<TPayload>
  payload: TPayload
}
