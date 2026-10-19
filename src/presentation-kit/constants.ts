import type { FitGeometry, Mode } from './types'

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds for persisting entities to move into their new layout. */
export const LAYOUT_T = 0.6
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to settle. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.3

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Wide-viewport threshold (CSS px) for the table of contents. */
export const WIDE_VIEWPORT_PX = 1024
/** Minimum horizontal travel (px) for a swipe to count. */
export const SWIPE_MIN_PX = 50

export const STAGE_LAYOUT: Record<Mode, FitGeometry> = {
  browse: { insetX: 24, insetTop: 72, insetBottom: 220 },
  present: { insetX: 24, insetTop: 72, insetBottom: 120 },
}
