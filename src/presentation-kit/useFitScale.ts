import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function getFitScale(width: number, height: number, mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min(1, (width - geometry.horizontal * 2) / designWidth, (height - geometry.top - geometry.bottom) / designHeight))
}

export function useFitScale(mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const [viewport, setViewport] = useState(() => ({ width: typeof window === 'undefined' ? designWidth : window.innerWidth, height: typeof window === 'undefined' ? designHeight : window.innerHeight }))
  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return getFitScale(viewport.width, viewport.height, mode, designWidth, designHeight)
}
