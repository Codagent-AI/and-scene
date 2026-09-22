import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function useFitScale(mode: PresentationMode) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      const { top: header, bottom: footer } = STAGE_LAYOUT[mode]
      const width = Math.max(0, window.innerWidth - 64)
      const height = Math.max(0, window.innerHeight - header - footer)
      setScale(Math.max(MIN_SCALE, Math.min(width / DESIGN_W, height / DESIGN_H)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode])
  return scale
}
