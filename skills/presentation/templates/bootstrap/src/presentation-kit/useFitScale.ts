import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  return Math.max(MIN_SCALE, Math.min(width / designWidth, height / designHeight))
}
export function stageGeometry(width: number, height: number, mode: Mode) {
  const wide = width >= WIDE_VIEWPORT
  const left = mode === 'browse' && wide ? 210 : 20
  const { top, bottom } = STAGE_LAYOUT[mode]
  return { left, top, width: Math.max(0, width - left - 20), height: Math.max(0, height - top - bottom), wide }
}
export function useFitScale(mode: Mode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const geometry = stageGeometry(size.width, size.height, mode)
  return { ...geometry, scale: fitScale(geometry.width, geometry.height, designWidth, designHeight) }
}
