import type { ComponentType } from 'react'

export type PresentationMode = 'present' | 'browse'

/** Props every scene component receives: the active step's diagram state. */
export interface SceneProps<TPayload> {
  payload: TPayload
}

/**
 * One named state of the evolving scene. Adjacent steps that share both
 * `groupKey` and `Scene` keep a single scene instance; only `payload` changes.
 * The on-screen step number is derived from array position and never stored.
 */
export interface Step<TPayload> {
  id: string
  /** Section/era label; consecutive steps with equal labels form one ToC entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
  Scene: ComponentType<SceneProps<TPayload>>
  groupKey?: string
  payload: TPayload
}

export interface AttributionOptions {
  label?: string
  href?: string
}
