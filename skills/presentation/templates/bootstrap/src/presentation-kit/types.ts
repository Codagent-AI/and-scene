import type { ComponentType, ReactNode } from 'react'

export type Mode = 'present' | 'browse'

/** Props every scene receives: the active step's payload. */
export interface SceneProps<P> {
  payload: P
}

export type SceneComponent<P> = ComponentType<SceneProps<P>>

/**
 * One named state of a scene. Steps that share a `groupKey` and `scene` keep
 * one mounted scene instance; only `payload` changes between them.
 */
export interface Step<P> {
  /** Stable identity. Never used for display numbering. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** One-line presenter title (present mode). */
  title: string
  /** Multi-line browse caption. */
  caption: string
  groupKey: string
  scene: SceneComponent<P>
  /** Diagram state shown while this step is active. */
  payload: P
}

export interface PresentationProps<P> {
  steps: readonly Step<P>[]
  title: string
  initialMode?: Mode
  /** Set false to omit the attribution link (the kit shows it by default). */
  attribution?: boolean
  /** Host-supplied header brand. The kit adds none by default. */
  brand?: ReactNode
  designWidth?: number
  designHeight?: number
}
