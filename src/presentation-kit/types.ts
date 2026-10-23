import type { ComponentType } from 'react'

export interface StepMeta {
  /** Stable identity; survives insertion, removal and reordering. */
  id: string
  /** Section/era label; consecutive steps with the same era form a ToC entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  stepId: string
  stepIndex: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Adjacent steps sharing a groupKey and Scene keep one mounted Scene instance. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  /** The diagram state shown while the step is active. */
  payload: TPayload
}
