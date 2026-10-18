import type { ComponentType } from 'react'

/** Narration and identity carried by every step. */
export interface StepMeta {
  id: string
  /** Section/era label; contiguous steps with the same label form one table-of-contents entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<TPayload = unknown> {
  payload: TPayload
  step: StepMeta
  stepIndex: number
  stepCount: number
}

export interface Step<TPayload = unknown> extends StepMeta {
  /** Adjacent steps sharing a group key and Scene keep one Scene instance alive. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  /** Diagram state shown while this step is active. */
  payload: TPayload
}
