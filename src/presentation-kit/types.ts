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

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Loose structural step shape; use `ValidSteps` to enforce the Scene/payload link. */
export interface AnyStep extends StepMeta {
  Scene: Scene<any>
  payload: unknown
  groupKey?: string
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type PayloadOf<S> = S extends { Scene: Scene<infer P> } ? P : never

/** Maps each step to itself if its payload matches its Scene's props, otherwise to `never`. */
export type ValidSteps<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends { payload: PayloadOf<T[K]> } ? T[K] : never
}
