import type { PresentationMode } from './types.ts'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.35
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const ENTER_T = 0.3
export const ENTER_DELAY = LAYOUT_T

export const STAGE_LAYOUT: Record<PresentationMode, { top: number; bottom: number }> = {
  browse: { top: 96, bottom: 190 },
  present: { top: 82, bottom: 92 },
}
