export const EASE = [0.22, 1, 0.36, 1] as const

/** Layout-morph duration for continuing entities, in seconds. */
export const LAYOUT_T = 0.6
/** Entrance duration for newcomers, in seconds. */
export const ENTER_T = 0.4
/** Newcomers wait for continuing entities to finish moving. */
export const ENTER_DELAY = LAYOUT_T
/** Exit duration for departing entities, in seconds. */
export const EXIT_T = 0.3

export const DESIGN_W = 880
export const DESIGN_H = 380
/** Fallback scale used only when the available area cannot be measured. */
export const MIN_SCALE = 0.05

/** Viewport width (px) from which the table of contents is shown in browse mode. */
export const WIDE_VIEWPORT = 1024
/** Minimum horizontal travel (px) for a swipe to count. */
export const SWIPE_MIN_PX = 50

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'

/** Per-mode space (px) reserved around the stage for chrome. Layout geometry only. */
export const STAGE_LAYOUT = {
  browse: { top: 64, bottom: 240, side: 24, tocWidth: 240 },
  present: { top: 64, bottom: 120, side: 24, tocWidth: 0 },
} as const

export type Mode = keyof typeof STAGE_LAYOUT
