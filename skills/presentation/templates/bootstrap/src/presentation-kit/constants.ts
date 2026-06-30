export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.7, ease: EASE }

export const ENTER_DELAY = 0.4
export const ENTER_T = { duration: 0.45, ease: EASE, delay: ENTER_DELAY }

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.35

export const STAGE_LAYOUT = {
  browse: { top: 96, bottom: 188, padX: 32, fitW: DESIGN_W, maxScale: 1.8 },
  present: { top: 104, bottom: 76, padX: 20, fitW: 790, maxScale: 2.6 },
} as const

export type StageLayout = (typeof STAGE_LAYOUT)[keyof typeof STAGE_LAYOUT]
