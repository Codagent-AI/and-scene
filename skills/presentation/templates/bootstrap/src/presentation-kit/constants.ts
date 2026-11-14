export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0 // Fit even very small viewports rather than overflowing them.
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.45, ease: EASE }
export const ENTER_DELAY = LAYOUT_T.duration
export const ENTER_T = { duration: 0.22, delay: ENTER_DELAY, ease: EASE }
export const SETTLE_MS = 850
export const STAGE_LAYOUT = {
  browse: { header: 104, footer: 190 },
  present: { header: 60, footer: 88 },
} as const
