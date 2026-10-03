import type { ComponentType, ReactNode } from 'react'

export type Mode = 'present' | 'browse'

export interface SceneProps<TPayload> {
  payload: TPayload
  stepId: string
  stepIndex: number
  isActive: boolean
}

export interface StepMeta {
  /** Stable identity, unique across the whole presentation. */
  id: string
  /** Section/era label the step belongs to. */
  era: string
  /** One-line presenter title (present mode). */
  title: string
  /** Browse-mode paragraph caption. */
  caption: string
}

export interface Step<TPayload = unknown> extends StepMeta {
  /**
   * Steps sharing a groupKey (and Scene component) are not remounted between
   * navigations — the scene instance persists and only `payload` changes.
   */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface PresentationProps<TPayload> {
  steps: Array<Step<TPayload>>
  title: string
  initialMode?: Mode
  /** Host-provided top-left brand slot content; the kit has no default brand. */
  brand?: ReactNode
}
