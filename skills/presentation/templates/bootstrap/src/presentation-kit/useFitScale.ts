import { useViewport } from './useViewport'

export function useFitScale(width: number, height: number, mode: 'browse' | 'present') {
  const viewport = useViewport()
  const top = mode === 'browse' ? 88 : 72
  const bottom = mode === 'browse' ? 154 : 76
  const side = 40
  return Math.min(1, Math.max(0.1, Math.min((viewport.width - side * 2) / width, (viewport.height - top - bottom) / height)))
}
