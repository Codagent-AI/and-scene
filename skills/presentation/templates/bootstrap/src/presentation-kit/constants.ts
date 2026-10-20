import type { DesignSize, Mode } from './types.ts'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const DEFAULT_DESIGN: DesignSize = { width: DESIGN_W, height: DESIGN_H }
export const MIN_SCALE = 0.2

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds persisting entities take to move to their new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to finish moving. */
export const ENTER_DELAY = LAYOUT_T

/** Viewport width (px) from which browse mode shows the table of contents. */
export const WIDE_VIEWPORT = 1024
/** Minimum horizontal travel (px) of a swipe. */
export const SWIPE_MIN = 50

/** Pixels reserved around the canvas for the header, footer and table of contents. */
export const STAGE_LAYOUT: Record<Mode, { top: number; bottom: number; side: number; toc: number }> = {
  browse: { top: 64, bottom: 220, side: 32, toc: 240 },
  present: { top: 64, bottom: 120, side: 32, toc: 0 },
}
