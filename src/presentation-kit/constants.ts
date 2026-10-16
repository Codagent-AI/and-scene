import type { Mode } from './types'

export const EASE = [0.22, 1, 0.36, 1] as const
/** Duration (s) of a layout morph for persisting entities. */
export const LAYOUT_T = 0.6
/** Duration (s) of a newcomer entrance. */
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to settle. */
export const ENTER_DELAY = LAYOUT_T

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Padding (px) kept around the scaled canvas for each mode's stage. */
export const STAGE_LAYOUT: Record<Mode, { insetX: number; insetY: number }> = {
  browse: { insetX: 8, insetY: 8 },
  present: { insetX: 32, insetY: 16 },
}

/** Viewport width (px) from which the browse table of contents shows. */
export const TOC_MIN_WIDTH = 900

export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_LABEL = 'made by and-scene'
