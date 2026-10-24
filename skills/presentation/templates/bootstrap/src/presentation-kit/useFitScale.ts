import { MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Canvas, Mode } from './types'
import { useViewport, type Viewport } from './useViewport'

export interface StageBox {
  top: number
  bottom: number
  side: number
  width: number
  height: number
}

export function stageBox(mode: Mode, viewport: Viewport): StageBox {
  const { insetTop, insetBottom, insetX } = STAGE_LAYOUT[mode]
  return {
    top: insetTop,
    bottom: insetBottom,
    side: insetX,
    width: viewport.width - insetX * 2,
    height: viewport.height - insetTop - insetBottom,
  }
}

/** Uniform fit scale: no upper cap, never below MIN_SCALE. */
export function computeFitScale(available: Viewport, canvas: Canvas): number {
  const fit = Math.min(available.width / canvas.width, available.height / canvas.height)
  return Math.max(MIN_SCALE, fit)
}

export function useFitScale(mode: Mode, canvas: Canvas): number {
  const viewport = useViewport()
  return computeFitScale(stageBox(mode, viewport), canvas)
}
