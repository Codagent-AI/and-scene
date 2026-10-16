import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity carried by every step. */
export interface StepMeta {
  /** Stable step identity. */
  id: string
  /** Section / era label; steps with the same era are grouped in the table of contents. */
  era: string
  /** One-line presenter title (shown in present mode). */
  title: string
  /** Paragraph caption (shown in browse mode). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** The active step's diagram state. */
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  /** Diagram state handed to `Scene` while this step is active. */
  payload: TPayload
  /**
   * Adjacent steps sharing a `groupKey` (and `Scene`) keep one mounted scene
   * instance; only `payload` changes, so entities update in place.
   */
  groupKey?: string
}

export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Class applied to the root so presentation-owned CSS can scope itself. */
  className?: string
  /** Optional host-provided top-left brand. The kit renders none by default. */
  brand?: React.ReactNode
  /** Replace the default attribution, or pass `null` to remove it. */
  attribution?: React.ReactNode
}
