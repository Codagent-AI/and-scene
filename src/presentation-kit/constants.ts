import type { Mode } from './types'

export const EASE = [0.22, 1, 0.36, 1] as const

/** Duration of the shared-layout morph for persisting entities, in seconds. */
export const LAYOUT_T = 0.6
/** Transition for layout projection; newcomers wait at least this long before they fade in. */
export const LAYOUT_TRANSITION = { duration: LAYOUT_T, ease: [0.22, 1, 0.36, 1] as const }
/** Departing entities fade out over the layout duration. */
export const EXIT = { opacity: 0, transition: { duration: LAYOUT_T, ease: [0.22, 1, 0.36, 1] as const } }
/** Duration of a newcomer's fade-in, in seconds. */
export const ENTER_T = 0.5
/** Newcomers start after persisting entities settle, so this is at least LAYOUT_T. */
export const ENTER_DELAY = 0.7

export const DESIGN_W = 880
export const DESIGN_H = 380

/** Floor for the uniform fit scale, so the canvas never collapses to nothing. */
export const MIN_SCALE = 0.3

/** Viewport width (px) at or above which browse mode shows the table of contents. */
export const WIDE_BREAKPOINT = 900

/** Minimum horizontal travel (px) for a touch gesture to count as a swipe. */
export const SWIPE_MIN_PX = 40

export const DEFAULT_MODE: Mode = 'browse'

export const STAGE_LAYOUT: Record<Mode, { width: number; height: number; padding: number }> = {
  browse: { width: DESIGN_W, height: DESIGN_H, padding: 16 },
  present: { width: DESIGN_W, height: DESIGN_H, padding: 8 },
}
