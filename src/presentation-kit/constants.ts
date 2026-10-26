export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.45, ease: EASE }
export const ENTER_DELAY = 0.48
export const ENTER_T = { duration: 0.24, delay: ENTER_DELAY }
export const SETTLE_MS = 850
export const STAGE_LAYOUT = {
  browse: { top: 112, bottom: 200, side: 24, toc: 190 },
  present: { top: 64, bottom: 120, side: 24, toc: 0 },
} as const
