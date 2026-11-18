import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export function stageGeometry(width: number, mode: Mode) {
  const geometry = STAGE_LAYOUT[mode]
  return width < 1000 ? { ...geometry, left: 16, right: 16 } : geometry
}
export function fitScale(width: number, height: number, canvasWidth = DESIGN_W, canvasHeight = DESIGN_H) {
  return Math.max(MIN_SCALE, Math.min(width / canvasWidth, height / canvasHeight))
}
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const geometry = stageGeometry(viewport.width, mode)
  return {
    geometry,
    wide: viewport.width >= 1000,
    scale: fitScale(viewport.width - geometry.left - geometry.right, viewport.height - geometry.top - geometry.bottom, width, height),
  }
}
