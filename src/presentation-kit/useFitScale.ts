import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const g = STAGE_LAYOUT[mode]
  return Math.max(0, Math.min((width - g.left - g.right) / designW, (height - g.top - g.bottom) / designH))
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
  const viewport = useViewport()
  return fitScale(viewport.width, viewport.height, mode, width, height)
}
