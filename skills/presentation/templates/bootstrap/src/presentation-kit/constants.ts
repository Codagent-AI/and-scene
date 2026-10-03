import type { StageLayout } from './types'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.35
export const LAYOUT_T = 0.6
export const ENTER_T = 0.28
export const ENTER_DELAY = LAYOUT_T
export const EASE = [0.22, 1, 0.36, 1] as const

export const STAGE_LAYOUT: Record<'browse' | 'present', StageLayout> = {
  browse: { header: 116, footer: 184, padding: 32 },
  present: { header: 76, footer: 92, padding: 24 },
}
