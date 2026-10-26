import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export function fitGeometry(width: number, height: number, mode: Mode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const layout = STAGE_LAYOUT[mode]
  const left = layout.side + (width >= 1100 ? layout.toc : 0)
  const availableWidth = Math.max(0, width - left - layout.side)
  const availableHeight = Math.max(0, height - layout.top - layout.bottom)
  const scale = Math.min(availableWidth / designWidth, availableHeight / designHeight, 1)
  return { scale, left, top: layout.top, width: availableWidth, height: availableHeight }
}
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return fitGeometry(viewport.width, viewport.height, mode, width, height)
}
