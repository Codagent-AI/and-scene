import { useLayoutEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function getFitScale(viewportWidth: number, viewportHeight: number, mode: PresentationMode) {
  const geometry = STAGE_LAYOUT[mode]
  const availableWidth = Math.max(0, viewportWidth)
  const availableHeight = Math.max(0, viewportHeight - geometry.top - geometry.bottom)
  return Math.max(MIN_SCALE, Math.min(availableWidth / DESIGN_W, availableHeight / DESIGN_H))
}

export function useFitScale(mode: PresentationMode) {
  const [scale, setScale] = useState(() => getFitScale(window.innerWidth, window.innerHeight, mode))

  useLayoutEffect(() => {
    const update = () => setScale(getFitScale(window.innerWidth, window.innerHeight, mode))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode])

  return { scale, width: DESIGN_W * scale, height: DESIGN_H * scale } satisfies { scale: number; width: number; height: number }
}
