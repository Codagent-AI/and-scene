export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.48, ease: EASE }
export const ENTER_DELAY = LAYOUT_T.duration
export const ENTER_T = { duration: 0.24, delay: ENTER_DELAY, ease: EASE }
export const SETTLE_MS = 850
export const STAGE_LAYOUT = {
  browse: { top: 100, bottom: 220, inset: 24 },
  present: { top: 40, bottom: 120, inset: 24 },
} as const
