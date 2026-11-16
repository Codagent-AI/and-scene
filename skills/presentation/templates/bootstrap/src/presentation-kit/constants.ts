export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.45, ease: EASE }
export const ENTER_DELAY = 0.46
export const ENTER_T = { duration: 0.22, delay: ENTER_DELAY }
export const MIN_SCALE = 0
export const SETTLE_MS = 800
export const STAGE_LAYOUT = {
  browse: { top: 112, bottom: 204, horizontal: 48, toc: 200 },
  present: { top: 88, bottom: 92, horizontal: 40, toc: 0 },
} as const
