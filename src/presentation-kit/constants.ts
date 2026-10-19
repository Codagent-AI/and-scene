/** Layout and motion constants owned by the kit. None of these are visual styles. */

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.25

/** Seconds a persisting entity takes to morph to its new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.35
/** Newcomers wait for persisting entities to settle before entering. */
export const ENTER_DELAY = LAYOUT_T + 0.05
export const EXIT_T = 0.25
export const EASE = [0.22, 1, 0.36, 1] as const

/** Viewports at least this wide (CSS px) show the table of contents in browse mode. */
export const WIDE_MIN_WIDTH = 1024

/** Minimum horizontal travel (px) of a swipe, and how much it must dominate vertical travel. */
export const SWIPE_MIN_DISTANCE = 50
export const SWIPE_AXIS_RATIO = 1.5

export type Mode = 'browse' | 'present'

/** Space (px) reserved around the fixed canvas for chrome, per mode. */
export interface StageGeometry {
  top: number
  bottom: number
  left: number
  right: number
}

export const STAGE_LAYOUT: Record<Mode, StageGeometry> = {
  browse: { top: 56, bottom: 220, left: 0, right: 0 },
  present: { top: 56, bottom: 120, left: 0, right: 0 },
}

/** Extra left space reserved for the table of contents on wide browse viewports. */
export const TOC_WIDTH = 240
