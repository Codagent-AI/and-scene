import type { ComponentType } from 'react'

/** Props every scene component receives. `payload` is the active step's diagram state. */
export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

/** Narration and identity for one step. */
export interface StepMeta {
  /** Stable identity; survives reordering. */
  id: string
  /** Section / era label used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode paragraph. */
  caption: string
}

/**
 * One step: narration plus the diagram state shown while it is active.
 * Adjacent steps with the same `groupKey` and the same `scene` share one
 * mounted scene instance; only `payload` changes.
 */
export interface Step<TPayload = undefined> extends StepMeta {
  scene: Scene<TPayload>
  payload: TPayload
  groupKey?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>

export type PresentationMode = 'present' | 'browse'
