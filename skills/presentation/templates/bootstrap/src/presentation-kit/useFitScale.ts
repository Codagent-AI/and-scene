import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function useFitScale(mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      const geometry = STAGE_LAYOUT[mode]
      const width = Math.max(0, window.innerWidth - geometry.sides * 2)
      const height = Math.max(0, window.innerHeight - geometry.top - geometry.bottom)
      setScale(Math.max(MIN_SCALE, Math.min(1, width / designWidth, height / designHeight)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode, designWidth, designHeight])
  return scale
}
