import type { Mode } from './types.ts'

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds a persisting entity takes to move to its new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to settle (never shorter than LAYOUT_T). */
export const ENTER_DELAY = 0.65
export const EXIT_T = 0.25

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.25

/** Viewport width (px) at which the browse-mode table of contents appears. */
export const WIDE_VIEWPORT = 1024
/** Horizontal travel (px) a swipe needs to navigate. */
export const SWIPE_THRESHOLD = 50

/** Space (px) reserved around the fixed canvas for each mode's chrome. */
export interface StageGeometry {
  top: number
  bottom: number
  side: number
  tocWidth: number
}

export const STAGE_LAYOUT: Record<Mode, StageGeometry> = {
  browse: { top: 72, bottom: 184, side: 32, tocWidth: 240 },
  present: { top: 56, bottom: 80, side: 24, tocWidth: 0 },
}

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
