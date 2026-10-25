export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.45, ease: EASE }
export const ENTER_DELAY = LAYOUT_T.duration
export const ENTER_T = { duration: 0.25, delay: ENTER_DELAY, ease: EASE }
export const SETTLE_MS = 850
export const STAGE_LAYOUT = {
  browse: { top: 120, bottom: 190, side: 32 },
  present: { top: 70, bottom: 110, side: 24 },
} as const
