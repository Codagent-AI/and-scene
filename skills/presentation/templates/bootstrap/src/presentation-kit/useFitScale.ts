import {
  DESIGN_H,
  DESIGN_W,
  MIN_SCALE,
  STAGE_LAYOUT,
  TOC_MIN_WIDTH,
  TOC_WIDTH,
  type Mode,
} from './constants'
import { useViewportSize } from './useViewport'

export function isTocVisible(mode: Mode, viewportWidth: number): boolean {
  return mode === 'browse' && viewportWidth >= TOC_MIN_WIDTH
}

/** One uniform factor fitting the design canvas into the viewport minus the mode's chrome. */
export function computeFitScale(
  viewportWidth: number,
  viewportHeight: number,
  mode: Mode,
  designW = DESIGN_W,
  designH = DESIGN_H,
): number {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const toc = isTocVisible(mode, viewportWidth) ? TOC_WIDTH : 0
  const availW = viewportWidth - toc - side * 2
  const availH = viewportHeight - top - bottom
  return Math.max(MIN_SCALE, Math.min(availW / designW, availH / designH))
}

export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H): number {
  const { width, height } = useViewportSize()
  return computeFitScale(width, height, mode, designW, designH)
}
