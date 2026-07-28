export const EASE = [0.22, 1, 0.36, 1] as const

export const LAYOUT_T = 0.5
export const ENTER_T = 0.35
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.3

export const DESIGN_W = 880
export const DESIGN_H = 380

export const MIN_SCALE = 0.35

export interface StageBox {
  top: number
  bottom: number
  left: number
  right: number
}

export const STAGE_LAYOUT: { browse: StageBox; present: StageBox } = {
  browse: { top: 96, bottom: 88, left: 24, right: 24 },
  present: { top: 64, bottom: 48, left: 24, right: 24 },
}
