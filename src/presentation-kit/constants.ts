import type { Mode } from './types'

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const LAYOUT_T = 0.6
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to finish their layout morph. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.25
export const STEP_FADE_T = 0.4

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.3

/** Viewport width (px) from which browse mode shows the table of contents. */
export const TOC_MIN_VIEWPORT = 960
/** Swipe threshold (px) for horizontal touch navigation. */
export const SWIPE_MIN_PX = 50

export interface StageGeometry {
  top: number
  bottom: number
  left: number
  right: number
  /** Extra left inset used when the table of contents is visible. */
  tocWidth: number
}

/** Space the chrome reserves around the fixed canvas, per mode. */
export const STAGE_LAYOUT: Record<Mode, StageGeometry> = {
  browse: { top: 72, bottom: 190, left: 12, right: 12, tocWidth: 240 },
  present: { top: 64, bottom: 120, left: 12, right: 12, tocWidth: 0 },
}

export const ATTRIBUTION_HREF = 'https://github.com/and-scene/and-scene'
export const ATTRIBUTION_TEXT = 'made by and-scene'
