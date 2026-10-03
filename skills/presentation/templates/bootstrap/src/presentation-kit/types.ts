import type { ReactNode } from 'react'

/** Live delivery hides caption/ToC/nav; browse is reading-focused. */
export type PresentationMode = 'present' | 'browse'

export interface SceneProps<TPayload = unknown> {
  payload: TPayload
  mode: PresentationMode
  active: boolean
  stepIndex: number
}

/**
 * `Scene` is declared with method shorthand (not a function-typed property) so
 * TypeScript compares it bivariantly. That lets steps with different, mutually
 * incompatible `TPayload`s live in one `Step[]` array — as required by grouped
 * scenes with strongly typed payloads — without the author casting anything at
 * the `<Presentation>` boundary.
 */
export interface Step<TPayload = unknown> {
  id: string
  era: string
  title: string
  caption: string
  /** Adjacent steps sharing a groupKey keep the same Scene instance mounted. */
  groupKey?: string
  payload: TPayload
  Scene(props: SceneProps<TPayload>): ReactNode
}

export interface AttributionOptions {
  show?: boolean
  label?: string
  href?: string
  className?: string
}

export interface PresentationProps {
  steps: Step[]
  title: string
  initialMode?: PresentationMode
  designWidth?: number
  designHeight?: number
  attribution?: AttributionOptions
  brand?: ReactNode
  className?: string
}
