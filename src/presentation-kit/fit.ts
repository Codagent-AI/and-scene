import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import type { Mode } from './types.ts'

/** Uniform scale that fits the design canvas into a box of the given size. */
export function computeFitScale(
  width: number,
  height: number,
  mode: Mode,
  design = { width: DESIGN_W, height: DESIGN_H },
): number {
  const { padX, padY, maxScale } = STAGE_LAYOUT[mode]
  const fit = Math.min((width - padX * 2) / design.width, (height - padY * 2) / design.height)
  return Math.max(MIN_SCALE, Math.min(maxScale, fit))
}
