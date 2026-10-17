import type { ComponentType, ReactElement } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity shared by every step. */
export interface StepMeta {
  /** Stable identity; survives reordering. */
  id: string
  /** Section / era label used for the marker and the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
}

export interface SceneProps<TPayload> {
  /** The diagram state for the active step. */
  payload: TPayload
}

/** A step as authored: a scene component plus the payload it shows while active. */
export interface Step<TPayload> extends StepMeta {
  /** Adjacent steps sharing a group and `Scene` keep one scene instance. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

/** A step ready for `<Presentation>`; the payload type is bound inside `defineStep`. */
export interface SceneStep extends StepMeta {
  groupKey?: string
  /** Identity of the `Scene` component, used to decide whether an instance persists. */
  sceneId: number
  render(): ReactElement
}

export interface Canvas {
  width: number
  height: number
}
