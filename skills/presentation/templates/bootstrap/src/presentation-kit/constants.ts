export const DESIGN_W = 880
export const DESIGN_H = 380

/** Lower bound for the fit scale so a tiny viewport never collapses the canvas. */
export const MIN_SCALE = 0.1

export const EASE = [0.22, 1, 0.36, 1] as const

/** Seconds a continuing entity takes to morph to its new layout. */
export const LAYOUT_T = 0.5
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.35
/** Seconds a newcomer waits so persisting entities settle first. */
export const ENTER_DELAY = LAYOUT_T

/** Viewport width (px) from which the table of contents is shown in browse mode. */
export const WIDE_VIEWPORT = 900

export interface StageGeometry {
  /** Space reserved above the canvas for the header chrome. */
  top: number
  /** Space reserved below the canvas for the footer chrome. */
  bottom: number
  /** Space reserved on each side of the canvas. */
  side: number
}

/** Per-mode fit geometry: the canvas is scaled into what the chrome leaves free. */
export const STAGE_LAYOUT: Record<'browse' | 'present', StageGeometry> = {
  browse: { top: 72, bottom: 270, side: 24 },
  present: { top: 72, bottom: 120, side: 24 },
}
