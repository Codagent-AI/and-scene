import type { ComponentType } from 'react'

export type PresentationMode = 'present' | 'browse'

/** Narration and identity shared by every step. */
export interface StepMeta {
  /** Stable identity; survives reordering. */
  id: string
  /** Section/era label used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
  /** Adjacent steps with the same key keep one mounted scene instance. */
  groupKey?: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  step: StepMeta
  index: number
}

export type Step<TPayload = undefined> = StepMeta & {
  /** The diagram component; reused across steps that share a group key. */
  Scene: ComponentType<SceneProps<TPayload>>
} & (undefined extends TPayload ? { payload?: TPayload } : { payload: TPayload })

// Any typed step array is accepted at the presentation boundary without casts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>

export interface CanvasSize {
  width: number
  height: number
}

export interface AttributionOptions {
  label?: string
  href?: string
}
