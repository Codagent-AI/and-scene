import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity shared by every step. */
export interface StepMeta {
  /** Stable identity; survives insertion, removal and reordering. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<P = undefined> {
  payload: P
  step: StepMeta
  index: number
}

type PayloadField<P> = undefined extends P ? { payload?: P } : { payload: P }

/**
 * One named state of the evolving scene. Adjacent steps with the same
 * `groupKey` and `Scene` keep one mounted scene instance; only `payload` changes.
 */
export type Step<P = undefined> = StepMeta & {
  groupKey?: string
  Scene: ComponentType<SceneProps<P>>
} & PayloadField<P>

export interface DesignSize {
  width: number
  height: number
}
