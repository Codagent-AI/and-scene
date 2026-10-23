import type { CanvasSize } from './types'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const DEFAULT_CANVAS: CanvasSize = { width: DESIGN_W, height: DESIGN_H }

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds persisting entities take to move to their new layout. */
export const LAYOUT_T = 0.5
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.35
/** Newcomers wait for persisting entities to settle first. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.2

export const MIN_SCALE = 0.2

/** Viewport width (px) from which the table of contents is shown in browse mode. */
export const TOC_MIN_WIDTH = 900
/** Minimum horizontal travel (px) that counts as a swipe. */
export const SWIPE_MIN_DISTANCE = 50

export interface StageLayout {
  /** Space (px) kept free on each side of the canvas, horizontally. */
  insetX: number
  /** Space (px) kept free on each side of the canvas, vertically. */
  insetY: number
}

/** Per-mode fit geometry for the stage. */
export const STAGE_LAYOUT: Record<'browse' | 'present', StageLayout> = {
  browse: { insetX: 24, insetY: 12 },
  present: { insetX: 8, insetY: 8 },
}

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/and-scene/and-scene',
}
