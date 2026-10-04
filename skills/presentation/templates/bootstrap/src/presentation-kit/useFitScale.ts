import { useEffect, useState } from 'react'
import type { PresentationMode } from './types'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'

export function calculateFitScale(width: number, height: number, mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const layout = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min(1, width / designWidth, Math.max(0, height - layout.top - layout.bottom) / designHeight))
}

export function useFitScale(mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const [scale, setScale] = useState(() => typeof window === 'undefined' ? 1 : calculateFitScale(window.innerWidth, window.innerHeight, mode, designWidth, designHeight))
  useEffect(() => {
    const update = () => setScale(calculateFitScale(window.innerWidth, window.innerHeight, mode, designWidth, designHeight))
    window.addEventListener('resize', update)
    update()
    return () => window.removeEventListener('resize', update)
  }, [mode, designWidth, designHeight])
  return scale
}
