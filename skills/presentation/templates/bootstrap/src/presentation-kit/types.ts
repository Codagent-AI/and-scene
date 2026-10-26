import type { ComponentType } from 'react'

/** Runtime mode: present is delivery-focused, browse is reading-focused. */
export type PresentationMode = 'present' | 'browse'

/** Narration and identity carried by every step, independent of its diagram payload. */
export interface StepMeta {
  /** Stable identity; does not change when steps are inserted/removed/reordered. */
  id: string
  /** Section/era label used to group steps in the table of contents. */
  section: string
  /** One-line presenter title shown in present mode and as the browse heading. */
  title: string
  /** Multi-line reading caption shown in browse mode. */
  caption: string
}

/** Props a step's Scene component receives while it is the active (or persisting) step. */
export interface SceneProps<TPayload> {
  /** The diagram state to render for the current step. */
  payload: TPayload
  /** Whether this step is the currently active step (vs. a settling neighbor). */
  active: boolean
}

/**
 * One named state in the evolving scene. Steps that share a `groupKey` (and the
 * same `Scene` component) are not remounted when navigating between them — the
 * component instance persists and only `payload` changes, preserving entity
 * continuity for layout morphs.
 */
export interface Step<TPayload> extends StepMeta {
  /** Scene component composing kit primitives for this step's diagram state. */
  Scene: ComponentType<SceneProps<TPayload>>
  /** The diagram state shown while this step is active. */
  payload: TPayload
  /** Adjacent steps sharing a groupKey and Scene persist the same instance. */
  groupKey?: string
}

/**
 * A step with its payload type erased, for hosting heterogeneous step arrays.
 *
 * Deliberately `any` rather than `unknown`: a `Step<TPayload>` carries its
 * payload both as data (covariant) and through `Scene`'s props (contravariant),
 * so `Step<unknown>` accepts no concrete step at all under strict function
 * variance. `any` is bivariant, which is what an intentionally erased type
 * needs. Each step still pairs its own `Scene` with its own `payload`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStep = Step<any>

export interface PresentationProps<TPayload> {
  /** Ordered steps making up the presentation. On-screen numbering derives from position. */
  steps: Step<TPayload>[]
  /** Presentation title shown in browse-mode chrome. */
  title: string
  /** Mode the presentation opens in. Defaults to 'present'. */
  initialMode?: PresentationMode
}
