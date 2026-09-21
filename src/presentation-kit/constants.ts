import type { FitGeometry, PresentationMode } from './types'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.35
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.65
export const ENTER_T = 0.35
export const ENTER_DELAY = LAYOUT_T

export const STAGE_LAYOUT: Record<PresentationMode, FitGeometry> = {
  browse: { width: DESIGN_W, height: DESIGN_H, top: 116, bottom: 186 },
  present: { width: DESIGN_W, height: DESIGN_H, top: 88, bottom: 92 },
}
