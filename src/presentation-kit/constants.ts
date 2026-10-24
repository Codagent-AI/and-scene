import type { Mode } from './types.ts'

export const EASE = [0.22, 1, 0.36, 1] as const

/** Seconds a persisting entity takes to morph to its next state. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to finish morphing. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.25

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.3

/** Viewport width (px) from which browse mode shows the table of contents. */
export const WIDE_VIEWPORT = 1024
/** Minimum horizontal travel (px) for a touch gesture to count as a swipe. */
export const SWIPE_THRESHOLD = 50

/** Fit geometry per mode: px reserved for chrome around the design canvas. */
export const STAGE_LAYOUT: Record<
  Mode,
  { top: number; bottom: number; side: number; toc: number }
> = {
  browse: { top: 72, bottom: 176, side: 16, toc: 232 },
  present: { top: 56, bottom: 96, side: 16, toc: 0 },
}
