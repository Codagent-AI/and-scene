import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'present' | 'browse'

/** Narration and identity carried by every step. */
export interface StepMeta {
  /** Stable identity; survives reordering. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** The diagram state for the active step. */
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Adjacent steps sharing a groupKey and Scene keep one mounted scene. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  /** Host-provided top-left branding; nothing is rendered when omitted. */
  brand?: ReactNode
  /** Replace the default attribution, or pass `false` to omit it. */
  attribution?: ReactNode | false
}
