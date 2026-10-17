import type { Mode } from './constants.ts'
import { computeScale, DEFAULT_CANVAS } from './fitScale.ts'
import type { Canvas } from './fitScale.ts'
import { useViewport } from './useViewport.ts'

/** Uniform fit scale for the active mode's stage geometry; constant within a mode. */
export function useFitScale(mode: Mode, canvas: Canvas = DEFAULT_CANVAS) {
  const { width, height } = useViewport()
  return computeScale(width, height, mode, canvas)
}
