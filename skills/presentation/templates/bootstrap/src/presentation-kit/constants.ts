import type { Mode } from './types.ts'

/** Default fixed design canvas. Entities are composed in these coordinates. */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Lowest fit scale; keeps the canvas finite and positive on tiny viewports. */
export const MIN_SCALE = 0.25

export const EASE = [0.22, 1, 0.36, 1] as const

/** Seconds a persisting entity takes to move to its new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.4
/** Newcomers wait this long so persisting entities settle first. */
export const ENTER_DELAY = 0.65

/** Viewport width (px) from which the table of contents is shown. */
export const WIDE_VIEWPORT_MIN = 900
/** Minimum horizontal travel (px) of a swipe. */
export const SWIPE_MIN_PX = 50

/**
 * Per-mode geometry reserved around the canvas, in px. `top`/`bottom` hold the
 * header and footer; `side` holds the table of contents on wide viewports.
 */
export const STAGE_LAYOUT: Record<Mode, { top: number; bottom: number; side: number }> = {
  browse: { top: 56, bottom: 196, side: 220 },
  present: { top: 56, bottom: 88, side: 0 },
}

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
} as const
