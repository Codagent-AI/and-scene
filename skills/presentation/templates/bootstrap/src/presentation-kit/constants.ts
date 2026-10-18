export type Mode = 'browse' | 'present'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

export const EASE = [0.4, 0, 0.2, 1] as const
/** Seconds a persisting entity takes to morph to its next state. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.35
/** Seconds a newcomer waits so persisting entities settle first. */
export const ENTER_DELAY = 0.7
export const LAYOUT_TRANSITION = { layout: { duration: LAYOUT_T, ease: EASE } } as const

/** Viewport width (px) from which the browse-mode table of contents shows. */
export const TOC_MIN_WIDTH = 1024
export const TOC_WIDTH = 220
/** Horizontal travel (px) a touch must cover to count as a swipe. */
export const SWIPE_MIN_PX = 40

export const ATTRIBUTION_HEIGHT = 28
export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'

/** Chrome geometry (px) reserved above/below the canvas, and the side gutter, per mode. */
export const STAGE_LAYOUT = {
  browse: { top: 96, bottom: 176, side: 24 },
  present: { top: 48, bottom: 96, side: 24 },
} as const
