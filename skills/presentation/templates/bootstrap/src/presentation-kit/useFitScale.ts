import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, w = DESIGN_W, h = DESIGN_H) {
  const layout = STAGE_LAYOUT[mode]
  const gutter = mode === 'browse' && width >= 1100 ? 210 : 0
  return Math.max(0, Math.min((width - gutter - layout.side * 2) / w, (height - layout.top - layout.bottom) / h))
}
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return { scale: fitScale(viewport.width, viewport.height, mode, width, height), wide: viewport.width >= 1100 }
}
