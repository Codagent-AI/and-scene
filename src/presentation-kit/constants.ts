export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.45
export const ENTER_T = 0.25
export const ENTER_DELAY = LAYOUT_T
export const SETTLE_MS = (LAYOUT_T + ENTER_T) * 1000 + 150
export const MIN_SCALE = 0
export const STAGE_LAYOUT = {
  browse: { top: 94, bottom: 190, left: 24, right: 24 },
  present: { top: 40, bottom: 100, left: 24, right: 24 },
} as const
