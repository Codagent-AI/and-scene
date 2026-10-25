import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export function fitScale(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  const tocWidth = mode === 'browse' && width >= 1100 ? 180 : 0
  return Math.max(0, Math.min(1, (width - geometry.side * 2 - tocWidth) / designW,
    (height - geometry.top - geometry.bottom) / designH))
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
