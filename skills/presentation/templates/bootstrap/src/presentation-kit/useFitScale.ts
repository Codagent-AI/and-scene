import { DESIGN_H, DESIGN_W } from './constants.ts'
import type { Mode } from './constants.ts'
import { availableStageSize, computeFitScale } from './fit.ts'
import { useViewport } from './useViewport.ts'

export interface Canvas {
  width: number
  height: number
}

/**
 * Scale for the active mode's stage geometry. Depends only on mode, viewport and
 * canvas, never on the active step, so morphs between steps stay undistorted.
 */
export function useFitScale(mode: Mode, canvas: Canvas = { width: DESIGN_W, height: DESIGN_H }): number {
  const viewport = useViewport()
  return computeFitScale(availableStageSize(mode, viewport), canvas)
}
