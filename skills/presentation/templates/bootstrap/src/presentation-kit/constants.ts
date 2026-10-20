import type { PresentationMode } from './types.ts'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2
export const WIDE_BREAKPOINT = 1024
export const SWIPE_MIN_DISTANCE = 50

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.6, ease: EASE }
export const ENTER_T = { duration: 0.4, ease: EASE }
/** Newcomers wait for the complete layout morph before they enter. */
export const ENTER_DELAY = LAYOUT_T.duration + 0.05
export const SCENE_FADE_T = { duration: 0.3, ease: EASE }

export interface StageGeometry {
  /** Pixels reserved above the canvas for the header. */
  top: number
  /** Pixels reserved below the canvas for the footer. */
  bottom: number
  /** Pixels reserved on each side of the canvas. */
  side: number
}

export const STAGE_LAYOUT: Record<PresentationMode, StageGeometry> = {
  browse: { top: 64, bottom: 208, side: 16 },
  present: { top: 56, bottom: 88, side: 16 },
}

export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_TEXT = 'made by and-scene'
