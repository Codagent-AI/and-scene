import type { PresentationMode } from './types'

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.45
export const ENTER_T = 0.24
export const ENTER_DELAY = 0.12
export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.25

export const STAGE_LAYOUT: Record<PresentationMode, {
  horizontalInset: number
  topInset: number
  bottomInset: number
}> = {
  browse: { horizontalInset: 24, topInset: 112, bottomInset: 176 },
  present: { horizontalInset: 24, topInset: 56, bottomInset: 72 },
}
