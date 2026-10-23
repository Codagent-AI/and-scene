import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

export interface SceneProps<TPayload> {
  payload: TPayload
}

/**
 * One named state of the evolving scene. Steps that share `groupKey` and the
 * same `Scene` keep one mounted scene instance and receive only a new payload.
 */
export interface Step<TPayload> {
  id: string
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph caption shown in browse mode. */
  caption: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}
