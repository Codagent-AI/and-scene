import type { ComponentType, ReactNode } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity every step carries. */
export interface StepMeta {
  /** Stable identity; never derived from position. */
  id: string
  /** Section / era label; consecutive equal labels form one table-of-contents entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** The active step's diagram state. */
  payload: TPayload
  stepIndex: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  /**
   * Adjacent steps sharing a groupKey and Scene keep one Scene instance;
   * only `payload` changes, so entities update in place.
   */
  groupKey?: string
  payload: TPayload
}

export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Host-provided top-left brand. Nothing is rendered by default. */
  brand?: ReactNode
  /** Set to false to drop the default bottom-right attribution. */
  attribution?: boolean
}
