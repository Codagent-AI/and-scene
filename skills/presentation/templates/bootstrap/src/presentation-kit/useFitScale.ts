import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function calculateFitScale(width: number, height: number, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  return Math.max(MIN_SCALE, Math.min(width / designWidth, height / designHeight))
}

export function useFitScale(mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      const geometry = STAGE_LAYOUT[mode]
      setScale(calculateFitScale(window.innerWidth, Math.max(1, window.innerHeight - geometry.header - geometry.footer), designWidth, designHeight))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode, designWidth, designHeight])
  return scale
}
