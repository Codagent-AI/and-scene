import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

export interface SceneProps<TPayload> {
  payload: TPayload
}

export interface Step<TPayload = unknown> {
  id: string
  era: string
  title: string
  caption: string
  /** Steps sharing a groupKey and Scene keep one mounted scene instance. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}
