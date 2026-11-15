import { useEffect, useState } from 'react'
import { COMPACT_STAGE_RATIO, COMPACT_VIEWPORT_H, DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitGeometry(width: number, height: number, mode: Mode) {
  const base = STAGE_LAYOUT[mode]
  const compact = height < COMPACT_VIEWPORT_H || width <= base.left + base.right
  const layout = compact ? { ...base, left: Math.min(base.left, Math.max(0, width) * 0.05), right: Math.min(base.right, Math.max(0, width) * 0.05) } : base
  const availableHeight = compact ? Math.max(0, height) * COMPACT_STAGE_RATIO[mode] : Math.max(0, height - base.top - base.bottom)
  return { compact, layout, availableHeight }
}
export function fitScale(width: number, height: number, mode: Mode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const { layout, availableHeight } = fitGeometry(width, height, mode)
  return Math.max(0, Math.min((width - layout.left - layout.right) / designWidth, availableHeight / designHeight))
}
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return { ...fitGeometry(viewport.width, viewport.height, mode), scale: fitScale(viewport.width, viewport.height, mode, width, height), wide: viewport.width >= 1100 }
}
