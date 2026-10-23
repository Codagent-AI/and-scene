import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  /** Zero-based position of the active step. */
  stepIndex: number
}

interface StepBase<TPayload> {
  /** Stable identity of the step. */
  id: string
  /** Section / era label; consecutive steps sharing a label form one table-of-contents entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode caption paragraph. */
  caption: string
  /** Diagram component shown while the step is active. */
  Scene: ComponentType<SceneProps<TPayload>>
  /**
   * Adjacent steps with the same groupKey and Scene share one mounted scene instance;
   * only the payload changes between them.
   */
  groupKey?: string
}

/** A named state of the scene. Numbering is derived from position, never stored. */
export type Step<TPayload = undefined> = StepBase<TPayload> &
  (undefined extends TPayload ? { payload?: TPayload } : { payload: TPayload })

export interface Canvas {
  width: number
  height: number
}

export interface AttributionOptions {
  text: string
  href: string
}
