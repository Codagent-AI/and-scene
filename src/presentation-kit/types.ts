import type { ComponentType } from 'react'

/** Narration and identity shared by every step. */
export interface StepMeta {
  /** Stable id; never derived from position. */
  id: string
  /** Section / era label; consecutive steps with the same label form one TOC entry. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

/** Props every Scene component receives. */
export interface SceneProps<TPayload = undefined> {
  step: StepMeta
  /** Zero-based position of the active step. */
  index: number
  payload: TPayload
}

export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

type PayloadField<TPayload> = undefined extends TPayload
  ? { payload?: TPayload }
  : { payload: TPayload }

/**
 * One step of a presentation. Adjacent steps sharing `groupKey` and the same
 * `Scene` keep a single scene instance; only `payload` changes.
 */
export type Step<TPayload = undefined> = StepMeta & {
  Scene: Scene<TPayload>
  groupKey?: string
} & PayloadField<TPayload>

/** Escape hatch for decks that mix scenes with different payload types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>
