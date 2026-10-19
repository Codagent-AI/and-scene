import type { ComponentType } from 'react'

export interface SceneProps<TPayload = undefined> {
  /** Diagram state for the active step. */
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

interface StepBase<TPayload> {
  /** Stable identity; never derived from position. */
  id: string
  /** Section/era label; contiguous steps with the same era form a table-of-contents entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
  /** The scene component. Steps sharing `groupKey` and `Scene` keep one mounted instance. */
  Scene: ComponentType<SceneProps<TPayload>>
  groupKey?: string
}

type PayloadField<TPayload> = [TPayload] extends [undefined]
  ? { payload?: undefined }
  : { payload: TPayload }

export type Step<TPayload = undefined> = StepBase<TPayload> & PayloadField<TPayload>
