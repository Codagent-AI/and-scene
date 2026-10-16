export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const ENTER_T = 0.4
export const ENTER_DELAY = LAYOUT_T

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'

/** Per-mode fit geometry: free space kept around the canvas and the largest scale allowed. */
export const STAGE_LAYOUT = {
  browse: { inset: 8, maxScale: 2.2 },
  present: { inset: 4, maxScale: 3 },
} as const

/** Viewport width (px) from which browse mode shows the table of contents. */
export const WIDE_VIEWPORT = 900
