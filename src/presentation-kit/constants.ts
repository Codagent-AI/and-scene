import type { Mode } from './types.ts'

export const DESIGN_W = 880
export const DESIGN_H = 380

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds persisting entities take to move to their new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer's fade takes. */
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to settle before entering. */
export const ENTER_DELAY = LAYOUT_T

export const MIN_SCALE = 0.2
export const MAX_SCALE = 3

/** Viewport width (px) from which the table of contents is shown in browse mode. */
export const WIDE_VIEWPORT = 1000

/** Horizontal swipe distance (px) needed to count as a swipe. */
export const SWIPE_THRESHOLD = 50

/** Space (px) reserved around the canvas inside the stage area, per mode. */
export const STAGE_LAYOUT: Record<Mode, { padX: number; padY: number }> = {
  browse: { padX: 32, padY: 16 },
  present: { padX: 8, padY: 8 },
}

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/and-scene/and-scene'
