import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants'
import type { Mode } from './types'

export function fitGeometry(width: number, height: number, mode: Mode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const layout = STAGE_LAYOUT[mode]
  const wide = width >= WIDE_VIEWPORT
  const left = layout.side + (wide ? layout.toc : 0)
  const availableWidth = Math.max(0, width - left - layout.side)
  const availableHeight = Math.max(0, height - layout.top - layout.bottom)
  return { scale: Math.max(0, Math.min(availableWidth / designWidth, availableHeight / designHeight)), left, top: layout.top, width: availableWidth, height: availableHeight, wide }
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
