import type { ComponentType, ReactNode } from 'react'

export type Mode = 'present' | 'browse'

/** Props every scene component receives for the active step. */
export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  stepIndex: number
}

/**
 * One named state of the evolving scene. Steps that share a `groupKey` and the
 * same `Scene` component keep one mounted scene instance; only `payload` changes.
 */
export interface Step<TPayload = undefined> {
  id: string
  /** Section / era label used by the table of contents. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  groupKey?: string
}

export interface AttributionOptions {
  label?: string
  href?: string
}

export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  className?: string
  /** Host-provided brand for the top-left header slot. Nothing is rendered by default. */
  brand?: ReactNode
  /** Pass `false` to hide the default bottom-right attribution. */
  attribution?: false | AttributionOptions
  /** Override the design canvas. */
  canvas?: { width: number; height: number }
}
