import { computeFit, type FitResult } from './geometry.ts'
import type { Mode } from './types.ts'
import { useViewport } from './useViewport.ts'

export function useFitScale(mode: Mode): FitResult {
  const { width, height } = useViewport()
  return computeFit(width, height, mode)
}
