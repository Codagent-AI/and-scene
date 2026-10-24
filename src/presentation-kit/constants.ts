import type { PresentationMode } from './types'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds persisting entities take to move to their new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer fades in, starting after persisting entities settle. */
export const ENTER_T = 0.4
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.25

export interface StageGeometry {
  /** Space reserved above the canvas for the header, in px. */
  top: number
  /** Space reserved below the canvas for the footer, in px. */
  bottom: number
  /** Space reserved left and right of the canvas, in px. */
  side: number
  /** Width reserved for the table of contents on wide viewports, in px. */
  tocWidth: number
  /** Viewport width at which the table of contents is shown. */
  tocMinViewport: number
}

export const STAGE_LAYOUT: Record<PresentationMode, StageGeometry> = {
  browse: { top: 72, bottom: 184, side: 24, tocWidth: 208, tocMinViewport: 960 },
  present: { top: 56, bottom: 96, side: 24, tocWidth: 0, tocMinViewport: 0 },
}
