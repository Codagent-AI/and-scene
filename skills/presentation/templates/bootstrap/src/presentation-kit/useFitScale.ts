import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode) {
  const gap = STAGE_LAYOUT[mode]
  return Math.max(0, Math.min((width - gap.horizontal) / DESIGN_W, (height - gap.vertical) / DESIGN_H))
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
