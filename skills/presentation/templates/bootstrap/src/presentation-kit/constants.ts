export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.55, ease: EASE }
export const ENTER_T = 0.35
export const ENTER_DELAY = 0.6
export const MIN_SCALE = 0.2
export const STAGE_LAYOUT = {
  browse: { top: 76, bottom: 202, side: 32 },
  present: { top: 70, bottom: 90, side: 32 },
} as const
