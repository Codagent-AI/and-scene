export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.65
export const ENTER_T = 0.45
export const ENTER_DELAY = LAYOUT_T

export const STAGE_LAYOUT = {
  browse: { top: 64, bottom: 132, horizontal: 32 },
  present: { top: 64, bottom: 64, horizontal: 32 },
  /** Browse geometry at or below `maxWidth`, where the footer stacks and needs more room. */
  narrowBrowse: { maxWidth: 720, top: 64, bottom: 180, horizontal: 32 },
} as const
