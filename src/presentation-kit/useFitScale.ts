import { useEffect, useState } from 'react'
import { STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function useFitScale(width: number, height: number, mode: PresentationMode) {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const geometry = STAGE_LAYOUT[mode]
  return Math.min(1, (viewport.width - geometry.side * 2) / width,
    (viewport.height - geometry.top - geometry.bottom) / height)
}
