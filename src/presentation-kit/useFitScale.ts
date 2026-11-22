import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, canvasWidth = DESIGN_W, canvasHeight = DESIGN_H) {
  const g = STAGE_LAYOUT[mode]
  return Math.max(0, Math.min((width - g.side * 2) / canvasWidth, (height - g.top - g.bottom) / canvasHeight))
}
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return fitScale(viewport.width, viewport.height, mode, width, height)
}
