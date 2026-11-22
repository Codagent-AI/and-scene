import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, canvasWidth = DESIGN_W, canvasHeight = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  return Math.max(0, Math.min((width - geometry.side * 2) / canvasWidth, (height - geometry.top - geometry.bottom) / canvasHeight, 1.5))
}
export function useViewport() {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return viewport
}
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const viewport = useViewport()
  return fitScale(viewport.width, viewport.height, mode, width, height)
}
