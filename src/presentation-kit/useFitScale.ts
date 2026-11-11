import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export function fitScale(width: number, height: number, mode: Mode) {
  const geometry = STAGE_LAYOUT[mode]
  return Math.max(0, Math.min((width - geometry.side * 2) / DESIGN_W,
    (height - geometry.top - geometry.bottom) / DESIGN_H))
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
export function useFitScale(mode: Mode) {
  const { width, height } = useViewport()
  return fitScale(width, height, mode)
}
