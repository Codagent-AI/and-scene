export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.5
export const ENTER_T = 0.35
/** Newcomers wait for persisting entities to finish their layout move. */
export const ENTER_DELAY = LAYOUT_T

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Browse-mode table of contents appears at or above this viewport width (px). */
export const WIDE_BREAKPOINT = 900
export const TOC_WIDTH = 180
/** Horizontal travel (px) a touch must exceed, and dominate vertical travel, to count as a swipe. */
export const SWIPE_THRESHOLD = 40

export type Mode = 'browse' | 'present'

/** Space reserved around the canvas for header and footer chrome, per mode. */
export const STAGE_LAYOUT: Record<Mode, { top: number; bottom: number; side: number }> = {
  browse: { top: 56, bottom: 170, side: 16 },
  present: { top: 56, bottom: 96, side: 16 },
}

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
