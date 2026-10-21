import type { ReactNode } from 'react'

export type PresentationMode = 'present' | 'browse'

export interface Canvas {
  width: number
  height: number
}

/** Props every scene component receives: the active step's payload. */
export interface SceneProps<TPayload = undefined> {
  payload: TPayload
}

// Method-style signature keeps scene components bivariant in their payload so a
// Step<P> can cross the Presentation boundary without casts, while mismatched
// Scene/payload pairs are still rejected where a Step<P> is declared.
export type Scene<TPayload = undefined> = {
  bivarianceHack(props: SceneProps<TPayload>): ReactNode
}['bivarianceHack']

export interface StepMeta {
  /** Stable identity; never derived from position. */
  id: string
  /** Section/era label, also the table-of-contents grouping. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

export interface Step<TPayload = undefined> extends StepMeta {
  /** Adjacent steps sharing a groupKey and Scene keep one mounted scene. */
  groupKey?: string
  Scene: Scene<TPayload>
  /** The diagram state shown while this step is active. */
  payload: TPayload
}

export interface AttributionOptions {
  /** Replaces the default "made by and-scene" link. */
  content: ReactNode
}

export interface PresentationProps {
  steps: readonly Step<unknown>[]
  title: string
  initialMode?: PresentationMode
  initialIndex?: number
  /** Host-provided top-left brand; the kit renders none by default. */
  brand?: ReactNode
  /** `false` removes the attribution, an object replaces it. */
  attribution?: false | AttributionOptions
  /** Overrides the fixed design canvas. */
  canvas?: Canvas
  className?: string
}
