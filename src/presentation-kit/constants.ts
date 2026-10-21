import type { Canvas, PresentationMode } from './types'

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds a persisting entity takes to move to its new layout. */
export const LAYOUT_T = 0.6
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to settle before entering. */
export const ENTER_DELAY = 0.65
export const EXIT_T = 0.25

export const DESIGN_W = 880
export const DESIGN_H = 380
export const DEFAULT_CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }
export const MIN_SCALE = 0.3

/** Viewport width (px) from which the browse table of contents is shown. */
export const WIDE_BREAKPOINT = 1000
export const TOC_WIDTH = 220
export const ATTRIBUTION_HEIGHT = 28
export const HEADER_HEIGHT = 56
/** Horizontal travel (px) a swipe needs, and it must exceed vertical travel. */
export const SWIPE_MIN_PX = 48

export interface StageInsets {
  top: number
  bottom: number
  left: number
  right: number
}

/** Space reserved around the canvas for chrome, per mode. */
export const STAGE_LAYOUT: Record<PresentationMode, StageInsets> = {
  browse: { top: HEADER_HEIGHT, bottom: 200, left: 0, right: 0 },
  present: { top: HEADER_HEIGHT, bottom: 112, left: 0, right: 0 },
}
