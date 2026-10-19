export const EASE = [0.22, 1, 0.36, 1] as const

/** Duration (s) of layout morphs for continuing entities. */
export const LAYOUT_T = 0.6
/** Duration (s) of newcomer entrances and departing exits. */
export const ENTER_T = 0.4
/** Newcomers wait this long (s) so persisting entities settle first. */
export const ENTER_DELAY = 0.6

export const DESIGN_W = 880
export const DESIGN_H = 380
/** Fallback scale for degenerate measurements only; never a lower clamp. */
export const MIN_SCALE = 0.1

export type PresentationMode = 'browse' | 'present'

/** Pixels reserved around the stage per mode (layout geometry, not style). */
export const STAGE_LAYOUT = {
  browse: { top: 72, bottom: 200, side: 16, toc: 208 },
  present: { top: 56, bottom: 110, side: 24, toc: 0 },
} as const

/** Height of the strip under the footer controls that holds the attribution. */
export const ATTRIBUTION_STRIP = 28

export const SWIPE_MIN_PX = 50
export const TOC_MIN_WIDTH = 1024

export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_LABEL = 'made by and-scene'
