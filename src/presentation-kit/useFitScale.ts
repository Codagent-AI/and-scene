import { useEffect, useState } from 'react'
import { STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function useFitScale(width: number, height: number, mode: PresentationMode) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const bounds = STAGE_LAYOUT[mode]
  const availableWidth = Math.max(0, viewport.width - bounds.horizontal * 2)
  const availableHeight = Math.max(0, viewport.height - bounds.top - bounds.bottom)
  return Math.min(availableWidth / width, availableHeight / height)
}
