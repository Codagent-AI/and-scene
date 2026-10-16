import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

/** Narration and identity shared by every step. */
export interface StepMeta {
  id: string
  /** Section / era label; consecutive equal labels form one table-of-contents entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode caption paragraph. */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  /** Index of the active step (for scenes that vary by position). */
  index: number
}

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  /**
   * Steps sharing a groupKey (and the same Scene) keep one mounted instance;
   * only the payload changes between them.
   */
  groupKey?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>
