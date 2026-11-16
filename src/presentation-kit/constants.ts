export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.48
export const ENTER_DELAY = LAYOUT_T
export const ENTER_T = 0.24
export const SETTLE_MS = 850
export const MIN_SCALE = 0 // Never overflow a tiny viewport by imposing a positive lower bound.
export const STAGE_LAYOUT = {
  browse: { top: 110, bottom: 210, side: 28 },
  present: { top: 64, bottom: 100, side: 24 },
} as const
