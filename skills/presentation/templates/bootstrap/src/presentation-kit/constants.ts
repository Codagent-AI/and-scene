export const EASE = [0.4, 0, 0.2, 1] as const

/** Durations are in seconds, matching Motion's transition API. */
export const LAYOUT_T = 0.5
export const ENTER_T = 0.35
export const ENTER_DELAY = 0.1

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

export type PresentationMode = 'present' | 'browse'

/** Fit geometry per mode: space kept around the canvas and the largest scale allowed. */
export const STAGE_LAYOUT = {
  browse: { insetX: 24, insetY: 12, maxScale: 1.5 },
  present: { insetX: 16, insetY: 8, maxScale: 2.5 },
} as const satisfies Record<
  PresentationMode,
  { insetX: number; insetY: number; maxScale: number }
>

/** Minimum horizontal travel, in CSS px, for a touch gesture to count as a swipe. */
export const SWIPE_MIN_PX = 40

/** Viewport width, in CSS px, from which browse mode shows the table of contents. */
export const TOC_MIN_WIDTH = 1024

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
