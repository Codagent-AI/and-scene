export const EASE = [0.22, 1, 0.36, 1] as const

/** Duration of a persisting entity's layout morph, in seconds. */
export const LAYOUT_T = 0.6
/** Duration of a newcomer's enter animation, in seconds. */
export const ENTER_T = 0.35
/** Newcomers wait for persisting entities to finish morphing. */
export const ENTER_DELAY = LAYOUT_T

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2
export const MAX_SCALE = 2

/** Padding (px) kept free around the scaled canvas inside the stage region, per mode. */
export const STAGE_LAYOUT = {
  browse: { padX: 16, padY: 8 },
  present: { padX: 24, padY: 16 },
} as const

/** Viewport width (px) from which browse mode shows the table of contents. */
export const WIDE_BREAKPOINT = 1000

export const SWIPE_THRESHOLD = 50

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_URL = 'https://github.com/and-scene/and-scene'
