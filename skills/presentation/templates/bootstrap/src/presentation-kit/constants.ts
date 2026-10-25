// Behavioral and geometric constants only. No colors, fonts, or other visual style.
export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2
export const MAX_SCALE = 2

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to finish their layout move. */
export const ENTER_DELAY = LAYOUT_T
/** Time after a step change before the scene is visually at rest (ms). */
export const SETTLE_MS = Math.ceil((ENTER_DELAY + ENTER_T) * 1000) + 200

/** Per-mode fit geometry: padding (design px) kept free around the scaled canvas. */
export const STAGE_LAYOUT = {
  browse: { padX: 16, padY: 8 },
  present: { padX: 48, padY: 16 },
} as const

export const SWIPE_MIN_DISTANCE = 50
export const WIDE_QUERY = '(min-width: 900px)'

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
