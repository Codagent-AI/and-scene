import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode) {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min((width - side * 2) / DESIGN_W, (height - top - bottom) / DESIGN_H, 1.4))
}
export function useFitScale(mode: Mode) {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return fitScale(size.width, size.height, mode)
}
