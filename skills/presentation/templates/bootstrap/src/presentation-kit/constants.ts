export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.62, ease: EASE }
export const ENTER_T = 0.34
export const ENTER_DELAY = 0.62
export const STAGE_LAYOUT = {
  browse: { top: 88, bottom: 154, side: 40 },
  present: { top: 72, bottom: 76, side: 40 },
} as const
export const EXIT = { opacity: 0, transition: { duration: ENTER_T } }
export const TOC_MIN_WIDTH = 768
