import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function calculateFitScale(width: number, height: number, mode: PresentationMode): number {
  const layout = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min(1, width / DESIGN_W, Math.max(0, height - layout.top - layout.bottom) / DESIGN_H))
}

export function useFitScale(mode: PresentationMode) {
  const [scale, setScale] = useState(() => typeof window === 'undefined' ? 1 : calculateFitScale(window.innerWidth, window.innerHeight, mode))
  useEffect(() => {
    if (typeof window === 'undefined') return
    const update = () => setScale(calculateFitScale(window.innerWidth, window.innerHeight, mode))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode])
  return scale
}
