import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function fitScale(width: number, height: number, mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min(1, (width - geometry.horizontal) / designWidth, (height - geometry.header - geometry.footer - geometry.vertical) / designHeight))
}

export function useFitScale(mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const [scale, setScale] = useState(() => typeof window === 'undefined' ? 1 : fitScale(window.innerWidth, window.innerHeight, mode, designWidth, designHeight))
  useEffect(() => {
    const update = () => setScale(fitScale(window.innerWidth, window.innerHeight, mode, designWidth, designHeight))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode, designWidth, designHeight])
  return scale
}
