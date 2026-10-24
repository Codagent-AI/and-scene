import type { Mode } from './types.ts'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.25

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds a persisting entity takes to morph. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.35
/** Newcomers wait for persisting entities to finish moving. */
export const ENTER_DELAY = LAYOUT_T + 0.05
export const EXIT_T = 0.25

/** Space (px) reserved around the canvas inside the stage viewport, per mode. */
export const STAGE_LAYOUT: Record<Mode, { insetX: number; insetY: number }> = {
  browse: { insetX: 24, insetY: 16 },
  present: { insetX: 56, insetY: 40 },
}

export const DEFAULT_MODE: Mode = 'browse'
/** Minimum horizontal travel (px) for a swipe to navigate. */
export const SWIPE_MIN_PX = 50
/** Viewport width (px) from which the table of contents is shown in browse mode. */
export const TOC_MIN_VIEWPORT = 1024

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
