import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, TOC_MIN_WIDTH, TOC_WIDTH } from './constants.ts'
import type { Mode } from './constants.ts'

export interface Canvas {
  width: number
  height: number
}

export const DEFAULT_CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }

/** Space available to the canvas in a mode, after header, footer and ToC. */
export function availableSpace(viewportW: number, viewportH: number, mode: Mode) {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const toc = mode === 'browse' && viewportW >= TOC_MIN_WIDTH ? TOC_WIDTH : 0
  return {
    width: Math.max(0, viewportW - side * 2 - toc),
    height: Math.max(0, viewportH - top - bottom),
  }
}

/** Uniform scale that fits the canvas into the space the active mode leaves. */
export function computeScale(
  viewportW: number,
  viewportH: number,
  mode: Mode,
  canvas: Canvas = DEFAULT_CANVAS,
) {
  const space = availableSpace(viewportW, viewportH, mode)
  return Math.max(MIN_SCALE, Math.min(space.width / canvas.width, space.height / canvas.height))
}
