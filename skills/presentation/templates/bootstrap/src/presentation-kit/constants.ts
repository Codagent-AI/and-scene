export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.55, ease: EASE }
export const ENTER_T = 0.35
export const ENTER_DELAY = 0.58
export const EXIT_T = 0.3
export const EXIT = { opacity: 0, transition: { duration: EXIT_T } } as const
export const STAGE_LAYOUT = {
  browse: { top: 82, bottom: 164 },
  present: { top: 72, bottom: 76 },
} as const
