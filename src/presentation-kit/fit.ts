import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './constants'

/** Uniform scale that fits the design canvas inside the available box for a mode. */
export function computeFitScale(
  availableWidth: number,
  availableHeight: number,
  mode: PresentationMode,
): number {
  const { insetX, insetY, maxScale } = STAGE_LAYOUT[mode]
  const scale = Math.min(
    (availableWidth - 2 * insetX) / DESIGN_W,
    (availableHeight - 2 * insetY) / DESIGN_H,
    maxScale,
  )
  return Math.max(MIN_SCALE, scale)
}
