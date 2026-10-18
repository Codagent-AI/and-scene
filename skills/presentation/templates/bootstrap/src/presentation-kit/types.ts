import type { ComponentType } from 'react'
import type { Mode } from './constants'

/** Narration and identity every step carries. */
export interface StepMeta {
  id: string
  /** Section/era label; consecutive steps with the same era form one table-of-contents entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  step: StepMeta
  index: number
  count: number
  mode: Mode
}

/** One named state of the scene. Steps sharing `groupKey` and `Scene` keep one mounted Scene. */
export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}
