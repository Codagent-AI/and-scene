import type { ComponentType } from 'react'
import type { Mode } from './constants'

export interface StepMeta {
  /** Stable step identity. */
  id: string
  /** Section / era label; drives the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Browse-mode caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  meta: StepMeta
  /** Zero-based position in the step list. */
  stepIndex: number
  mode: Mode
}

export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: Scene<TPayload>
  payload: TPayload
  /** Adjacent steps sharing a groupKey and Scene keep one persistent scene instance. */
  groupKey?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>
