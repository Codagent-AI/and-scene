export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const ENTER_T = 0.4
export const ENTER_DELAY = LAYOUT_T

/** Viewport width at which the table of contents is shown in browse mode. */
export const TOC_MIN_WIDTH = 900

export type Mode = 'browse' | 'present'

/** Per-mode fit geometry: insets kept free around the canvas, and the scale ceiling. */
export const STAGE_LAYOUT: Record<Mode, { insetX: number; insetY: number; maxScale: number }> = {
  browse: { insetX: 16, insetY: 8, maxScale: 1.5 },
  present: { insetX: 32, insetY: 16, maxScale: 3 },
}

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_URL = 'https://github.com/and-scene/and-scene'
