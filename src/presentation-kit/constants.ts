export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.45
export const ENTER_T = 0.25
export const ENTER_DELAY = LAYOUT_T
export const SETTLE_MS = (LAYOUT_T + ENTER_T) * 1000 + 100
export const STAGE_LAYOUT = {
  browse: { top: 110, bottom: 200, side: 24 },
  present: { top: 55, bottom: 120, side: 24 },
} as const
