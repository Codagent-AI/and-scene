import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function computeFitScale(width: number, height: number, mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H): number {
  const geometry = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min((width - geometry.horizontal * 2) / designWidth, (height - geometry.top - geometry.bottom) / designHeight))
}
export function useFitScale(mode: PresentationMode) {
  const [scale, setScale] = useState(() => typeof window === 'undefined' ? 1 : computeFitScale(window.innerWidth, window.innerHeight, mode))
  useEffect(() => {
    const update = () => setScale(computeFitScale(window.innerWidth, window.innerHeight, mode))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode])
  return scale
}
