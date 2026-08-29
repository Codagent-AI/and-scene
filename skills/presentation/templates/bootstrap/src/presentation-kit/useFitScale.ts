import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function calculateFitScale(
  viewportWidth: number,
  viewportHeight: number,
  mode: PresentationMode,
) {
  const layout = STAGE_LAYOUT[mode]
  const availableWidth = Math.max(0, viewportWidth - layout.horizontalInset * 2)
  const availableHeight = Math.max(0, viewportHeight - layout.topInset - layout.bottomInset)
  return Math.max(MIN_SCALE, Math.min(availableWidth / DESIGN_W, availableHeight / DESIGN_H))
}

function currentScale(mode: PresentationMode) {
  if (typeof window === 'undefined') return 1
  return calculateFitScale(window.innerWidth, window.innerHeight, mode)
}

export function useFitScale(mode: PresentationMode) {
  const [scale, setScale] = useState(() => currentScale(mode))

  useEffect(() => {
    const updateScale = () => setScale(currentScale(mode))
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [mode])

  return scale
}
