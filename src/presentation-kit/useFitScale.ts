import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function getFitScale(width: number, height: number, mode: PresentationMode) {
  const layout = STAGE_LAYOUT[mode]
  return Math.max(0, Math.min(1, width / DESIGN_W, (height - layout.top - layout.bottom) / DESIGN_H))
}

export function useFitScale(mode: PresentationMode) {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return getFitScale(size.width, size.height, mode)
}
