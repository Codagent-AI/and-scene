import { useEffect, useState } from 'react'
import { DESIGN_W, DESIGN_H, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const g = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min((width - g.left - g.right) / designW, (height - g.top - g.bottom) / designH))
}
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return fitScale(viewport.width, viewport.height, mode, designW, designH)
}
