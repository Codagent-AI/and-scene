import { MAX_SCALE, MIN_SCALE, DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export interface Size {
  width: number
  height: number
}

/**
 * Uniform scale that fits the design canvas inside `size` for the given mode.
 * The same factor applies on both axes, so the composition never distorts.
 */
export function fitScale(
  size: Size,
  mode: Mode,
  designWidth: number = DESIGN_W,
  designHeight: number = DESIGN_H,
): number {
  const { padX, padY } = STAGE_LAYOUT[mode]
  const byWidth = (size.width - padX * 2) / designWidth
  const byHeight = (size.height - padY * 2) / designHeight
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(byWidth, byHeight)))
}
