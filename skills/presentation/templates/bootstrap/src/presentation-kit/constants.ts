import type { Mode } from './types.ts'

export const DESIGN_W = 880
export const DESIGN_H = 380
/** Guard against a non-positive scale when the viewport leaves no room at all; never a visual floor. */
export const MIN_SCALE = 0.01

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.6, ease: EASE }
export const ENTER_T = { duration: 0.4, ease: EASE }
/** Newcomers wait until persisting entities have finished their layout morph. */
export const ENTER_DELAY = LAYOUT_T.duration + 0.05

/** Viewport width at and above which browse mode shows the table of contents. */
export const TOC_BREAKPOINT = 1100

export interface StageGeometry {
  top: number
  bottom: number
  side: number
  tocWidth: number
}

/** Space (px) the chrome reserves around the stage in each mode. */
export const STAGE_LAYOUT: Record<Mode, StageGeometry> = {
  browse: { top: 72, bottom: 184, side: 16, tocWidth: 240 },
  present: { top: 56, bottom: 96, side: 16, tocWidth: 0 },
}

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
