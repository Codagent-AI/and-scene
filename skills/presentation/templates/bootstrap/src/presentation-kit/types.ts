import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

export interface StepMeta {
  /** Stable identity of the step. */
  id: string
  /** Section / era label used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  /** Diagram state for the active step. */
  payload: TPayload
  step: StepMeta
  index: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Adjacent steps with the same group and Scene share one scene instance. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

export interface Canvas {
  width: number
  height: number
}

export type AttributionOption = false | { label?: string; href?: string }
