import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity carried by every step. */
export interface StepMeta {
  /** Stable id, independent of position. */
  id: string
  /** Section / era label; consecutive steps with the same label form a section. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

/**
 * One named state of the scene. Steps sharing a `groupKey` and the same `Scene`
 * component keep one mounted instance; only `payload` changes between them.
 */
export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}

export interface CanvasSize {
  width: number
  height: number
}

export interface AttributionOptions {
  label?: string
  href?: string
}
