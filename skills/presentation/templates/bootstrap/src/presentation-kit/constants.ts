export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.1

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.45
export const ENTER_T = 0.2
export const ENTER_DELAY = LAYOUT_T

export const STAGE_LAYOUT = {
  browse: { reservedHeight: 220, reservedWidth: 32 },
  present: { reservedHeight: 100, reservedWidth: 32 },
} as const
