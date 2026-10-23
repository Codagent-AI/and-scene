import { CHROME_HEIGHT, MAX_SCALE, MIN_SCALE, DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export interface Size {
  width: number
  height: number
}

/**
 * Uniform scale that fits the design canvas inside the viewport for the given mode,
 * after the mode's fixed chrome and padding. Depends only on viewport and mode, never
 * on the active step's content. The same factor applies on both axes.
 */
export function fitScale(
  viewport: Size,
  mode: Mode,
  designWidth: number = DESIGN_W,
  designHeight: number = DESIGN_H,
): number {
  const { padX, padY } = STAGE_LAYOUT[mode]
  const byWidth = (viewport.width - padX * 2) / designWidth
  const byHeight = (viewport.height - CHROME_HEIGHT[mode] - padY * 2) / designHeight
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(byWidth, byHeight)))
}
