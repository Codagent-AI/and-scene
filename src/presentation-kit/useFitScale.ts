import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function geometry(width: number, mode: Mode) {
  const base = STAGE_LAYOUT[mode]
  return width < 1000 ? { ...base, left: 20, right: 20, bottom: mode === 'browse' ? 260 : base.bottom } : base
}
export function fitScale(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const g = geometry(width, mode)
  return Math.max(MIN_SCALE, Math.min((width - g.left - g.right) / designW, (height - g.top - g.bottom) / designH))
}
export function useViewport() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const { width, height } = useViewport()
  return { scale: fitScale(width, height, mode, designW, designH), geometry: geometry(width, mode) }
}
