import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function computeFitScaleState(width: number, height: number, mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  const availableScale = Math.min((width - geometry.horizontal * 2) / designWidth, (height - geometry.top - geometry.bottom) / designHeight)
  return { scale: Math.max(MIN_SCALE, availableScale), overflowing: availableScale < MIN_SCALE }
}
export function computeFitScale(width: number, height: number, mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H): number {
  return computeFitScaleState(width, height, mode, designWidth, designHeight).scale
}
export function useFitScale(mode: PresentationMode) {
  const [fit, setFit] = useState(() => typeof window === 'undefined' ? { scale: 1, overflowing: false } : computeFitScaleState(window.innerWidth, window.innerHeight, mode))
  useEffect(() => {
    const update = () => setFit(computeFitScaleState(window.innerWidth, window.innerHeight, mode))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode])
  return fit
}
