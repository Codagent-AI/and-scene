/** Fixed design canvas: every scene is composed in these units and scaled to fit. */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Motion timing, in seconds. Newcomers wait for persisting entities to finish morphing. */
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const ENTER_T = 0.4
export const ENTER_DELAY = 0.65
export const EXIT_T = 0.3

export const MIN_SCALE = 0.2

/** Viewports at least this wide show the table of contents in browse mode. */
export const WIDE_BREAKPOINT = 1024

/** A swipe needs at least this much horizontal travel, and more horizontal than vertical. */
export const SWIPE_MIN_PX = 50

export type Mode = 'browse' | 'present'

/** Space (px) the chrome reserves around the canvas in each mode. */
export interface StageGeometry {
  top: number
  bottom: number
  side: number
}

export const STAGE_LAYOUT: Record<Mode, StageGeometry> = {
  browse: { top: 64, bottom: 230, side: 24 },
  present: { top: 56, bottom: 24, side: 16 },
}

export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_LABEL = 'made by and-scene'
