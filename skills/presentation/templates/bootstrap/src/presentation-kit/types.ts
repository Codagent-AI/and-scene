import type { ComponentType } from 'react'

export interface StepMeta {
  /** Stable step identity. */
  id: string
  /** Section / era label; consecutive steps with the same era form a ToC entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode paragraph. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  /**
   * Steps that share a groupKey (and Scene) keep one mounted Scene instance;
   * only the payload changes. Without a groupKey the step id is the key.
   */
  groupKey?: string
}
