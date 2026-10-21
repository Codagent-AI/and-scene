import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export interface Viewport {
  width: number
  height: number
}

/** Space the canvas may occupy for a mode, after reserving the chrome. */
export function availableSpace(mode: Mode, viewport: Viewport) {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  return {
    width: viewport.width - 2 * side,
    height: viewport.height - top - bottom,
  }
}

/** Uniform scale that fits the design canvas into the mode's free space; no upper cap. */
export function computeFitScale(mode: Mode, viewport: Viewport): number {
  const space = availableSpace(mode, viewport)
  return Math.max(MIN_SCALE, Math.min(space.width / DESIGN_W, space.height / DESIGN_H))
}
