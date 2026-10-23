import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity every step carries. */
export interface StepMeta {
  /** Stable identity. */
  id: string
  /** Section / era label; consecutive steps with the same era form a section. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** Diagram state shown while this step is active. */
  payload: TPayload
  stepIndex: number
}

/**
 * One named state of the evolving scene. Adjacent steps that share a `groupKey`
 * and the same `Scene` component keep one scene instance; only `payload` changes.
 */
export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}

export interface Rect {
  x: number
  y: number
  w?: number
  h?: number
}

export interface AttributionOptions {
  label?: string
  href?: string
}
