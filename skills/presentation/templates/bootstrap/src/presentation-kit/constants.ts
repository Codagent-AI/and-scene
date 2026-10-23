import type { Mode } from './types.ts'

/** Default fixed design canvas, in design pixels. */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Never scale the canvas below this factor, even in a tiny viewport. */
export const MIN_SCALE = 0.25

/** Per-mode fit geometry: space kept free around the canvas inside the stage area. */
export interface StageLayout {
  insetX: number
  insetY: number
}

export const STAGE_LAYOUT: Record<Mode, StageLayout> = {
  browse: { insetX: 16, insetY: 12 },
  present: { insetX: 32, insetY: 24 },
}

export const EASE = [0.22, 1, 0.36, 1] as const

/** Seconds a persisting entity takes to morph to its new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.4
/** Newcomers wait until persisting entities have settled. */
export const ENTER_DELAY = LAYOUT_T + 0.1
/** Seconds an exiting entity or scene takes to fade out. */
export const EXIT_T = 0.3

/** Minimum horizontal travel (px) for a touch gesture to count as a swipe. */
export const SWIPE_MIN = 50
/** Viewports at least this wide (px) show the table of contents in browse mode. */
export const TOC_MIN_WIDTH = 1024

export const ATTRIBUTION_TEXT = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/and-scene/and-scene'

/** Spread onto a subtree whose overlapping content is intentional and readable. */
export const ALLOW_OVERLAP = { 'data-presentation-allow-overlap': '' } as const
