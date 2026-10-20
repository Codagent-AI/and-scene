export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.25

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds a persisting entity takes to morph to its new layout. */
export const LAYOUT_T = 0.5
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.25
/** Newcomers wait for persisting entities to finish moving. */
export const ENTER_DELAY = LAYOUT_T

/** Space the stage leaves for header and footer chrome, per mode. */
export const STAGE_LAYOUT = {
  browse: { top: 56, bottom: 232 },
  present: { top: 56, bottom: 104 },
} as const

export const WIDE_BREAKPOINT = 960
export const ATTRIBUTION_RESERVE = 32
export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
