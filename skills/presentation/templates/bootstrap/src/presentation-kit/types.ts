import type { ComponentType } from 'react'

/** Narration and identity carried by every step. */
export interface StepMeta {
  /** Stable identity, unique within a presentation. */
  id: string
  /** Section/era label; consecutive steps with the same era form a ToC section. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** Diagram state of the active step. */
  payload: TPayload
  step: StepMeta
  index: number
}

export type SceneComponent<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: SceneComponent<TPayload>
  payload: TPayload
  /**
   * Adjacent steps sharing a `groupKey` and `Scene` keep one scene instance;
   * only `payload` changes, so entities update in place.
   */
  groupKey?: string
}

/** A step with its payload type erased, for decks mixing several payload types. */
export interface AnyStep extends StepMeta {
  Scene: SceneComponent<unknown>
  payload: unknown
  groupKey?: string
}

/** Erase a step's payload type at the definition site (the only cast in the kit). */
export function defineStep<TPayload>(step: Step<TPayload>): AnyStep {
  return step as unknown as AnyStep
}
