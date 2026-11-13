export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.45, ease: EASE }
export const ENTER_DELAY = LAYOUT_T.duration
export const ENTER_T = { duration: 0.2, delay: ENTER_DELAY }
export const SETTLE_MS = 900
export const STAGE_LAYOUT = {
  browse: { header: 88, footer: 170, gutter: 24 },
  present: { header: 56, footer: 90, gutter: 24 },
} as const
