import type { ComponentType } from 'react'

export interface SceneProps<TPayload = undefined> {
  /** Diagram state for the active step. */
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

/** The narrative fields every step carries, independent of its scene. */
export interface StepMeta {
  /** Stable identity; never derived from position. */
  id: string
  /** Section/era label; contiguous steps with the same era form a table-of-contents entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

/** A scene component; steps sharing `groupKey` and `Scene` keep one mounted instance. */
export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

interface StepBase<TPayload> extends StepMeta {
  Scene: Scene<TPayload>
  groupKey?: string
}

type PayloadField<TPayload> = [TPayload] extends [undefined]
  ? { payload?: undefined }
  : { payload: TPayload }

export type Step<TPayload = undefined> = StepBase<TPayload> & PayloadField<TPayload>
