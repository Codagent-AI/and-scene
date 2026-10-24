import { DESIGN_H, DESIGN_W, MAX_SCALE, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export interface CanvasSize {
  width: number
  height: number
}

/** Uniform scale that fits the design canvas into the stage region for the given mode. */
export function fitScale(
  region: CanvasSize,
  mode: Mode,
  canvas: CanvasSize = { width: DESIGN_W, height: DESIGN_H },
): number {
  const { padX, padY } = STAGE_LAYOUT[mode]
  const sx = (region.width - padX * 2) / canvas.width
  const sy = (region.height - padY * 2) / canvas.height
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(sx, sy)))
}
