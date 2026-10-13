import type { ComponentType } from 'react'

export type PresentationMode = 'browse' | 'present'

export interface StepMeta {
  id: string
  era: string
  title: string
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
}

export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>

export interface Step<TPayload = undefined> extends StepMeta {
  Scene: Scene<TPayload>
  payload: TPayload
  /** Adjacent steps with this key AND the same Scene preserve their instance. */
  groupKey?: string
}

/** Mark only intentionally overlapping, readable author-owned subtrees. */
export const ALLOW_OVERLAP_ATTRIBUTE = 'data-presentation-allow-overlap'
