import type { ComponentType } from 'react'

export type PresentationMode = 'present' | 'browse'

export interface SceneProps<TPayload> {
  /** The active step's data for this scene. */
  payload: TPayload
  /** Position of the active step within the whole presentation. */
  stepIndex: number
  /** Whether this scene's step is the one currently on screen. */
  isActive: boolean
}

export interface Step<TPayload> {
  /** Stable identity, independent of position. */
  id: string
  /** Section/era label used to group steps in the table of contents. */
  era: string
  /** One-line presenter title, shown in present mode. */
  title: string
  /** Multi-line browse-mode caption. */
  caption: string
  /** Data describing the diagram state while this step is active. */
  payload: TPayload
  /** The component that renders this step's diagram state. */
  Scene: ComponentType<SceneProps<TPayload>>
  /**
   * Steps that share a groupKey and Scene component are not remounted between
   * navigations — the Scene instance persists and only payload changes.
   */
  groupKey?: string
}

export interface PresentationProps<TPayload> {
  steps: Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
}
