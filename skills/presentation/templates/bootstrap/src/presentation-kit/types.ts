import type { ComponentType } from 'react'
import type { Mode } from './constants.ts'

export interface SceneProps<TPayload = unknown> {
  payload: TPayload
  /** Zero-based index of the active step. */
  stepIndex: number
}

export interface Step<TPayload = unknown> {
  /** Stable identity of the step. */
  id: string
  /** Section/era label; consecutive steps with the same era form a section. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph browse caption. */
  caption: string
  /** Scene component that renders the diagram state. */
  Scene: ComponentType<SceneProps<TPayload>>
  /** Diagram state handed to Scene while this step is active. */
  payload: TPayload
  /** Steps that share a groupKey and Scene keep one persistent scene instance. */
  groupKey?: string
}

// Heterogeneous payload types must meet in one array at the host boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>

export interface Attribution {
  href?: string
  label?: string
}

export interface PresentationProps {
  steps: readonly AnyStep[]
  title: string
  initialMode?: Mode
  /** Host-provided top-left brand; the kit renders none by default. */
  brand?: React.ReactNode
  /** Class applied to the presentation root, for presentation-owned styling. */
  className?: string
  /** Override the bottom-right attribution, or `false` to omit it. */
  attribution?: Attribution | false
}
