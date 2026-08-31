import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

function calculateScale(mode: PresentationMode) {
  const layout = STAGE_LAYOUT[mode]
  const width = Math.max(0, window.innerWidth - layout.horizontalPadding * 2)
  const height = Math.max(0, window.innerHeight - layout.top - layout.bottom)
  return Math.max(MIN_SCALE, Math.min(width / DESIGN_W, height / DESIGN_H, 1))
}

export function useFitScale(mode: PresentationMode) {
  const [scale, setScale] = useState(() => calculateScale(mode))

  useEffect(() => {
    const updateScale = () => setScale(calculateScale(mode))
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [mode])

  return scale
}
