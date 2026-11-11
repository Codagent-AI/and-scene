export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.45
export const ENTER_T = 0.25
export const ENTER_DELAY = LAYOUT_T
export const STAGE_LAYOUT = {
  browse: { top: 112, bottom: 206, side: 32 },
  present: { top: 32, bottom: 104, side: 24 },
} as const
export const entityTransition = {
  layout: { duration: LAYOUT_T, ease: EASE },
  opacity: { duration: ENTER_T, delay: ENTER_DELAY },
  y: { duration: ENTER_T, delay: ENTER_DELAY },
}
