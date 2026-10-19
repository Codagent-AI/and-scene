import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity carried by every step. */
export interface StepMeta {
  /** Stable identity; unique within a presentation. */
  id: string
  /** Section/era label; consecutive steps with the same era form one ToC entry. */
  era: string
  /** Presenter title (one line). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** Diagram state shown while the step is active. */
  payload: TPayload
  stepIndex: number
  mode: Mode
}

/**
 * One step of a presentation. Adjacent steps that share both `groupKey` and
 * `Scene` keep a single scene instance alive; only `payload` changes.
 */
export interface Step<TPayload = undefined> extends StepMeta {
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface Canvas {
  width: number
  height: number
}

export interface AttributionOptions {
  label?: string
  href?: string
}
