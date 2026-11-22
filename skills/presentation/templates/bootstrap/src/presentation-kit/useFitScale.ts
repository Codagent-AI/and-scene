import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min((width - side * 2) / designWidth, (height - top - bottom) / designHeight))
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
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const size = useViewport()
  return fitScale(size.width, size.height, mode, width, height)
}
