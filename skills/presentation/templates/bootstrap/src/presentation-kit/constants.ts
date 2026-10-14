export const EASE = [0.22, 1, 0.36, 1] as const

/** Seconds for persisting entities to move to their new layout. */
export const LAYOUT_T = 0.55
/** Seconds for a newcomer's enter animation. */
export const ENTER_T = 0.35
/** Seconds newcomers wait so persisting entities settle first. */
export const ENTER_DELAY = LAYOUT_T

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.25

/** Viewport width at which the browse-mode table of contents is shown. */
export const WIDE_VIEWPORT_MIN = 1100

/** Pixel gap reserved around the canvas per mode (header above, footer below). */
export const STAGE_LAYOUT = {
  browse: { top: 64, bottom: 200, left: 0, right: 0, tocWidth: 220 },
  present: { top: 64, bottom: 96, left: 0, right: 0, tocWidth: 0 },
} as const

export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_LABEL = 'made by and-scene'
