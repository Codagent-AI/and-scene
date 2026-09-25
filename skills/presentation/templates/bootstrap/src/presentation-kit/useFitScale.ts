import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function getFitScale(width: number, height: number, mode: PresentationMode) {
  const layout = STAGE_LAYOUT[mode]
  const availableWidth = Math.max(0, width - layout.horizontal * 2)
  const availableHeight = Math.max(0, height - layout.top - layout.bottom)
  return Math.max(MIN_SCALE, Math.min(1, availableWidth / DESIGN_W, availableHeight / DESIGN_H))
}

export function useFitScale(mode: PresentationMode) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return getFitScale(viewport.width, viewport.height, mode)
}
