import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, type Mode } from './constants'

export function computeFitScale(viewportW: number, viewportH: number, mode: Mode): number {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const availW = viewportW - side * 2
  const availH = viewportH - top - bottom
  return Math.max(MIN_SCALE, Math.min(availW / DESIGN_W, availH / DESIGN_H))
}

export function useViewport(): { width: number; height: number } {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/** Uniform scale for the active mode's stage geometry. Constant within a mode and viewport. */
export function useFitScale(mode: Mode): number {
  const { width, height } = useViewport()
  return computeFitScale(width, height, mode)
}
