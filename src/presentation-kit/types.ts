import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

/** Per-step narration and identity (no diagram state). */
export interface StepMeta {
  /** Stable identity; never used for numbering. */
  id: string
  /** Section/era label; the table of contents lists distinct eras. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph browse caption. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** Diagram state shown while this step is active. */
  payload: TPayload
  step: StepMeta
  /** Zero-based position of the active step. */
  index: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Steps with the same groupKey and Scene share one persistent scene instance. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface Canvas {
  width: number
  height: number
}

export interface FitGeometry {
  /** Horizontal space reserved on each side of the canvas, in CSS px. */
  insetX: number
  /** Space reserved above the canvas (header), in CSS px. */
  insetTop: number
  /** Space reserved below the canvas (footer), in CSS px. */
  insetBottom: number
}
