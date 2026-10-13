export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.1
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.55
export const ENTER_T = 0.25
export const ENTER_DELAY = LAYOUT_T
export const WIDE_VIEWPORT = 1100

// Reserved geometry is independent of each step's text or entity count.
export const STAGE_LAYOUT = {
  browse: { top: 112, bottom: 228, gutter: 24, tocWidth: 200 },
  present: { top: 64, bottom: 104, gutter: 24, tocWidth: 0 },
} as const
