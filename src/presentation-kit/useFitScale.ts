import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, TOC_W, WIDE_VIEWPORT } from './constants'
import type { PresentationMode } from './types'
import { useViewportSize } from './useViewportSize'

/** Region (px) the canvas may occupy: the gap between the mode's header and footer. */
export function availableStage(width: number, height: number, mode: PresentationMode) {
  const { header, footer, side } = STAGE_LAYOUT[mode]
  const tocW = mode === 'browse' && width >= WIDE_VIEWPORT ? TOC_W : 0
  return { width: width - tocW - 2 * side, height: height - header - footer, left: tocW }
}

/** One uniform scale for both axes, floored at MIN_SCALE and never capped above. */
export function computeFitScale(width: number, height: number, mode: PresentationMode): number {
  const avail = availableStage(width, height, mode)
  return Math.max(MIN_SCALE, Math.min(avail.width / DESIGN_W, avail.height / DESIGN_H))
}

export function useFitScale(mode: PresentationMode): number {
  const { width, height } = useViewportSize()
  return computeFitScale(width, height, mode)
}
