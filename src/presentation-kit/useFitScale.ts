import { useViewport } from './useViewport'
import { STAGE_LAYOUT } from './constants'

export function useFitScale(width: number, height: number, mode: 'browse' | 'present') {
  const viewport = useViewport()
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  return Math.min(1, Math.max(0.1, Math.min((viewport.width - side * 2) / width, (viewport.height - top - bottom) / height)))
}
