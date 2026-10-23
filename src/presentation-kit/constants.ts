import type { Mode } from './types'

/** Shared easing curve for layout morphs and entries. */
export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds a persisting entity takes to morph to its new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to enter. */
export const ENTER_T = 0.45
/** Seconds newcomers wait so persisting entities settle first. Must be >= LAYOUT_T. */
export const ENTER_DELAY = 0.7

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Viewports at or above this width show the table of contents in browse mode. */
export const WIDE_VIEWPORT_MIN = 1024
/** Minimum horizontal travel, in CSS px, for a touch swipe. */
export const SWIPE_MIN_PX = 40
/** A swipe must travel more than this multiple of its vertical travel. */
export const SWIPE_DOMINANCE = 1.5

export const ATTRIBUTION_TEXT = 'made by and-scene'
export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'

/**
 * Fit geometry for each mode. `reservedHeight` is the fixed vertical budget for chrome (header,
 * footer, and captions). The scale depends only on the viewport and the mode, never on the
 * active step's caption length, so it stays constant within a mode. Layout geometry only.
 */
export const STAGE_LAYOUT: Record<Mode, { padX: number; padY: number; reservedHeight: number }> = {
  browse: { padX: 24, padY: 16, reservedHeight: 360 },
  present: { padX: 16, padY: 8, reservedHeight: 120 },
}
