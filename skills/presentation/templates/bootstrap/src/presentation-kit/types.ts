import type { ComponentType } from 'react'

/** The two runtime modes a presentation can be viewed in. */
export type PresentationMode = 'present' | 'browse'

/** Props passed to every step's Scene component. */
export interface SceneProps<TPayload> {
  /** The data this step's diagram state should render. */
  payload: TPayload
  /** Whether this step is the currently active one. */
  active: boolean
}

/** Narration/identity fields carried by every step, independent of payload. */
export interface StepMeta {
  /** Stable identity, independent of position. */
  id: string
  /** Section/era label used for table-of-contents grouping. */
  era: string
  /** One-line presenter title shown in present mode. */
  title: string
  /** Paragraph-length browse-mode caption. */
  caption: string
}

/**
 * A single named state of the evolving scene. Steps that share a `groupKey`
 * render the same `Scene` instance without remounting between them; only the
 * active step's `payload` changes.
 */
export interface Step<TPayload = unknown> extends StepMeta {
  /** Steps sharing a groupKey persist one Scene instance across navigation. */
  groupKey?: string
  payload: TPayload
  Scene: ComponentType<SceneProps<TPayload>>
}

/**
 * A type-erased Step usable in a heterogeneous steps array. Each step is
 * authored with its own concrete `Step<TPayload>` type (so its Scene and
 * payload stay aligned without casts); assigning it into `AnyStep` is a
 * widening, not a cast, so the typed-payload boundary is preserved at the
 * point of authoring.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional type erasure: `any` is required so `Step<TPayload>` (with its Scene/payload pairing in a contravariant position) widens into a heterogeneous array without an explicit cast at the authoring boundary.
export type AnyStep = Step<any>

export interface PresentationProps {
  steps: AnyStep[]
  title: string
  initialMode?: PresentationMode
}
