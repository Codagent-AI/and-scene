import { DESIGN_H, DESIGN_W, MAX_SCALE, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import type { Mode } from './types.ts'

export interface CanvasSize {
  width: number
  height: number
}

export const DEFAULT_CANVAS: CanvasSize = { width: DESIGN_W, height: DESIGN_H }

/** One uniform scale factor so the composition never reflows. */
export function computeFitScale(
  available: { width: number; height: number },
  mode: Mode,
  canvas: CanvasSize = DEFAULT_CANVAS,
): number {
  const { padX, padY } = STAGE_LAYOUT[mode]
  const w = Math.max(0, available.width - padX * 2)
  const h = Math.max(0, available.height - padY * 2)
  const scale = Math.min(w / canvas.width, h / canvas.height)
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
}
