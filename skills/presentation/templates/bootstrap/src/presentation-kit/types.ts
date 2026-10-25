import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity shared by every step. */
export interface StepMeta {
  /** Stable identity, independent of position. */
  id: string
  /** Section/era label; consecutive steps with the same label form a section. */
  era: string
  /** One-line presenter title (present mode). */
  title: string
  /** Paragraph caption (browse mode). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  /** Zero-based index of the active step. */
  index: number
  mode: Mode
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Component drawing the diagram state for this step. */
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  /**
   * Adjacent steps with the same groupKey and Scene component keep one mounted
   * scene instance; only the payload changes.
   */
  groupKey?: string
}

// Steps with different payload types live in one array; the payload type is
// checked where each step is defined, so the host accepts any of them uncast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>

export interface OutlineEntry {
  step: AnyStep
  index: number
  /** One-based number derived from position. */
  number: number
  eraIndex: number
}

export interface Era {
  label: string
  firstIndex: number
  indices: number[]
}
