import type { Transition } from 'motion/react'

export const EASE = [0.22, 1, 0.36, 1] as const
/** Duration (s) of layout morphs for persisting entities. */
export const LAYOUT_T = 0.6
/** Duration (s) of enter/exit fades for newcomers. */
export const ENTER_T = 0.35
/** Delay (s) before newcomers enter, so persisting entities settle first. */
export const ENTER_DELAY = LAYOUT_T * 0.8

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Viewport width (px) at or above which the table of contents is shown in browse mode. */
export const WIDE_VIEWPORT = 1100

export const LAYOUT_TRANSITION: Transition = {
  layout: { duration: LAYOUT_T, ease: EASE },
}

export interface StageGeometry {
  /** Pixels reserved above the canvas for the header. */
  top: number
  /** Pixels reserved below the canvas for the footer. */
  bottom: number
  /** Pixels reserved at the left/right edges. */
  side: number
  /** Extra left inset reserved for the table of contents (wide viewports only). */
  toc: number
}

export const STAGE_LAYOUT: { browse: StageGeometry; present: StageGeometry } = {
  browse: { top: 88, bottom: 220, side: 24, toc: 220 },
  present: { top: 72, bottom: 120, side: 24, toc: 0 },
}

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/and-scene/and-scene',
}
