import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function getFitScale(width: number, height: number, mode: PresentationMode) {
  const gap = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min(1, (width - gap.horizontal) / DESIGN_W, (height - gap.vertical) / DESIGN_H))
}

export function useFitScale(mode: PresentationMode) {
  const [scale, setScale] = useState(() => typeof window === 'undefined' ? 1 : getFitScale(window.innerWidth, window.innerHeight, mode))
  useEffect(() => {
    const update = () => setScale(getFitScale(window.innerWidth, window.innerHeight, mode))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode])
  return scale
}

