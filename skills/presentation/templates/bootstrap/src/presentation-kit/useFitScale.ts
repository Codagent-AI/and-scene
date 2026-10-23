import {
  DESIGN_H,
  DESIGN_W,
  MIN_SCALE,
  STAGE_LAYOUT,
  TOC_WIDTH,
  WIDE_BREAKPOINT,
  type Mode,
} from './constants'
import { useViewportSize } from './useViewportSize'

export interface Canvas {
  width: number
  height: number
}

export const DEFAULT_CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }

export function showsToc(mode: Mode, viewportWidth: number): boolean {
  return mode === 'browse' && viewportWidth >= WIDE_BREAKPOINT
}

/** Space left for the canvas once the mode's chrome has been reserved. */
export function availableSpace(viewportW: number, viewportH: number, mode: Mode) {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const left = side + (showsToc(mode, viewportW) ? TOC_WIDTH : 0)
  return { top, bottom, left, right: side, width: viewportW - left - side, height: viewportH - top - bottom }
}

/** Uniform scale depending only on viewport, mode geometry and canvas, never on the step. */
export function computeFitScale(
  viewportW: number,
  viewportH: number,
  mode: Mode,
  canvas: Canvas = DEFAULT_CANVAS,
): number {
  const avail = availableSpace(viewportW, viewportH, mode)
  return Math.max(MIN_SCALE, Math.min(avail.width / canvas.width, avail.height / canvas.height))
}

export function useFitScale(mode: Mode, canvas: Canvas = DEFAULT_CANVAS): number {
  const { width, height } = useViewportSize()
  return computeFitScale(width, height, mode, canvas)
}
