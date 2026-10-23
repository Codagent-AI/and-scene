import type { ModeGeometry, Mode } from './types.ts'

export const EASE = [0.22, 1, 0.36, 1] as const
/** Duration (s) of layout morphs for persisting entities. */
export const LAYOUT_T = 0.6
/** Duration (s) of newcomer entry. */
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to finish their layout morph. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.3

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Viewport width (px) from which the table of contents is shown in browse mode. */
export const WIDE_VIEWPORT_PX = 1100

export const STAGE_LAYOUT: Record<Mode, ModeGeometry> = {
  browse: { top: 72, bottom: 176, side: 240 },
  present: { top: 64, bottom: 72, side: 0 },
}

export const SWIPE_MIN_DISTANCE = 50

export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_TEXT = 'made by and-scene'
