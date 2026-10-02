import { useEffect, useState } from 'react'
import type { PresentationMode } from './types'
import { STAGE_LAYOUT } from './constants'

export function useFitScale(width: number, height: number, mode: PresentationMode) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const geometry = STAGE_LAYOUT[mode]
  const availableHeight = Math.max(1, viewport.height - geometry.top - geometry.bottom)
  return Math.min(viewport.width / width, availableHeight / height, 1)
}
