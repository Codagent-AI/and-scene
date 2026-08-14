import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function useFitScale(mode: PresentationMode) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const measure = () => {
      const geometry = STAGE_LAYOUT[mode]
      const width = Math.max(0, window.innerWidth - geometry.horizontalPadding * 2)
      const height = Math.max(0, window.innerHeight - geometry.header - geometry.footer)
      setScale(Math.max(MIN_SCALE, Math.min(width / DESIGN_W, height / DESIGN_H)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [mode])

  return scale
}
