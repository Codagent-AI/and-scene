export const DESIGN_W = 880
export const DESIGN_H = 380
export const LAYOUT_T = 0.55
export const ENTER_T = 0.32
export const ENTER_DELAY = LAYOUT_T
export const EASE = [0.22, 1, 0.36, 1] as const
/** Space reserved around the fixed scene canvas in each chrome mode. */
export const STAGE_LAYOUT = {
  browse: { top: 104, bottom: 176, side: 48 },
  present: { top: 72, bottom: 104, side: 40 },
} as const
