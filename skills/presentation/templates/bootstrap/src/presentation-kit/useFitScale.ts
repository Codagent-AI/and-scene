import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode) {
  const g = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min(1, (width - g.sides * 2) / DESIGN_W, (height - g.top - g.bottom) / DESIGN_H))
}
export function useViewport() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return size
}
export function useFitScale(mode: Mode) { const { width, height } = useViewport(); return fitScale(width, height, mode) }
