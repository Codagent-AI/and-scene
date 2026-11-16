export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.5, ease: EASE }
export const ENTER_DELAY = LAYOUT_T.duration
export const ENTER_T = { duration: 0.25, delay: ENTER_DELAY, ease: EASE }
export const STAGE_LAYOUT = {
  browse: { top: 110, bottom: 200, side: 24 },
  present: { top: 40, bottom: 110, side: 24 },
} as const
