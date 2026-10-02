import { useEffect, useState } from 'react'
import { STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function useFitScale(width: number, height: number, mode: PresentationMode) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      const geometry = STAGE_LAYOUT[mode]
      const availableWidth = Math.max(0, window.innerWidth - geometry.side * 2)
      const availableHeight = Math.max(0, window.innerHeight - geometry.top - geometry.bottom)
      setScale(Math.min(1, availableWidth / width, availableHeight / height))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [width, height, mode])
  return scale
}
