export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.25

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const ENTER_T = 0.35
/** Newcomers wait for persisting entities to finish their layout morph. */
export const ENTER_DELAY = LAYOUT_T

/** Per-mode fit geometry: inset around the canvas and the largest allowed upscale. */
export const STAGE_LAYOUT = {
  browse: { inset: 16, maxScale: 3 },
  present: { inset: 8, maxScale: 3 },
} as const

export const WIDE_VIEWPORT = 960
export const SWIPE_THRESHOLD = 50

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
