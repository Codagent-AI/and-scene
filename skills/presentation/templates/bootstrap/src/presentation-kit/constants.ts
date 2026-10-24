export const EASE = [0.22, 1, 0.36, 1] as const

/** Seconds persisting entities take to move to their new positions. */
export const LAYOUT_T = 0.5
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.45
/** Seconds newcomers wait after the layout morph has finished. */
export const ENTER_DELAY = 0.1

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Viewport width (CSS px) at which the browse-mode table of contents appears. */
export const WIDE_VIEWPORT_MIN = 1024
/** Minimum horizontal travel (px) for a touch gesture to count as a swipe. */
export const SWIPE_MIN_PX = 50

/** Space (px) the chrome reserves around the stage in each mode. */
export const STAGE_LAYOUT = {
  browse: { insetTop: 88, insetBottom: 200, insetX: 16 },
  present: { insetTop: 56, insetBottom: 80, insetX: 16 },
} as const

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
} as const
