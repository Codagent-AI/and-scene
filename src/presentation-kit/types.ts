import type { ComponentType } from 'react'

/** Narration and identity shared by every step. */
export interface StepMeta {
  /** Stable step identity. */
  id: string
  /** Section / era label; consecutive equal labels form one ToC entry. */
  era: string
  /** Presenter one-liner. */
  title: string
  /** Browse-mode paragraph. */
  caption: string
}

/** Props the active step passes to its scene component. */
export interface SceneProps<TPayload = unknown> {
  payload: TPayload
  step: StepMeta
  /** Zero-based position of the active step. */
  index: number
}

/**
 * One named state of the scene. Adjacent steps that share `groupKey` and
 * `Scene` reuse the same scene instance; only `payload` changes.
 */
export interface Step<TPayload = unknown> extends StepMeta {
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface CanvasSize {
  width: number
  height: number
}
