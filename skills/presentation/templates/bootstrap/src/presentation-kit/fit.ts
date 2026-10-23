import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import type { Canvas, Mode } from './types.ts'

export interface Viewport {
  width: number
  height: number
}

/** Uniform scale that fits the canvas between the reserved chrome areas. */
export function computeFitScale(
  viewport: Viewport,
  mode: Mode,
  showSide: boolean,
  canvas: Canvas = { width: DESIGN_W, height: DESIGN_H },
): number {
  const g = STAGE_LAYOUT[mode]
  const availW = viewport.width - (showSide ? g.side : 0)
  const availH = viewport.height - g.top - g.bottom
  const scale = Math.min(availW / canvas.width, availH / canvas.height)
  return Math.max(MIN_SCALE, scale)
}
