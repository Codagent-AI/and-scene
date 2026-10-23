import type { Mode } from './types'

// Canvas geometry. Layout behavior only; the kit carries no visual style.
export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

// Motion timing, in seconds. Newcomers start once persisting entities have
// finished their layout transition (ENTER_DELAY >= LAYOUT_T).
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.5
export const ENTER_DELAY = 0.5
export const ENTER_T = 0.35
export const EXIT_T = 0.25

export const WIDE_VIEWPORT = 1000

export interface StageGeometry {
  top: number
  bottom: number
  side: number
  tocSide: number
}

// Per-mode fit geometry: pixels of the viewport reserved for chrome around the
// scaled canvas. `tocSide` replaces `side` while the table of contents shows.
export const STAGE_LAYOUT: Record<Mode, StageGeometry> = {
  browse: { top: 56, bottom: 200, side: 8, tocSide: 200 },
  present: { top: 56, bottom: 96, side: 8, tocSide: 0 },
}

export const SWIPE_MIN_PX = 50

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
