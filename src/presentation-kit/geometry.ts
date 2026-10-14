import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants'
import type { PresentationMode } from './types'

export interface ViewportSize {
  viewportWidth: number
  viewportHeight: number
  mode: PresentationMode
}

export interface StageRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * The region between header and footer where the canvas is fit. The table of
 * contents column only exists in browse mode on wide viewports.
 */
export function stageRect({ viewportWidth, viewportHeight, mode }: ViewportSize): StageRect {
  const layout = STAGE_LAYOUT[mode]
  const left = mode === 'browse' && viewportWidth >= WIDE_VIEWPORT ? layout.side : 0
  return {
    left,
    top: layout.top,
    width: Math.max(0, viewportWidth - left),
    height: Math.max(0, viewportHeight - layout.top - layout.bottom),
  }
}

/** Uniform scale that fits the design canvas inside the mode's stage region. */
export function computeFitScale(size: ViewportSize): number {
  const rect = stageRect(size)
  const { inset } = STAGE_LAYOUT[size.mode]
  const availableWidth = rect.width - 2 * inset
  const availableHeight = rect.height - 2 * inset
  const fit = Math.min(availableWidth / DESIGN_W, availableHeight / DESIGN_H)
  return Math.max(MIN_SCALE, fit)
}
