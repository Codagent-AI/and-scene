import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants.ts'
import type { Canvas, Mode } from './types.ts'
import { useViewportSize } from './useViewportSize.ts'

export const isWideViewport = (width: number) => width >= WIDE_VIEWPORT

/** Uniform scale that fits the design canvas between the chrome of `mode`. */
export function computeFitScale(
  viewportWidth: number,
  viewportHeight: number,
  mode: Mode,
  canvas: Canvas = { width: DESIGN_W, height: DESIGN_H },
) {
  const layout = STAGE_LAYOUT[mode]
  const toc = mode === 'browse' && isWideViewport(viewportWidth) ? layout.toc : 0
  const byWidth = (viewportWidth - toc - 2 * layout.side) / canvas.width
  const byHeight = (viewportHeight - layout.top - layout.bottom) / canvas.height
  return Math.max(MIN_SCALE, Math.min(byWidth, byHeight))
}

export function useFitScale(mode: Mode, canvas?: Canvas) {
  const { width, height } = useViewportSize()
  return computeFitScale(width, height, mode, canvas)
}
