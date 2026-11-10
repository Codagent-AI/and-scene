import { useEffect, useState } from 'react'
import { fitScale, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function useFitScale(mode: Mode) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const geometry = STAGE_LAYOUT[mode]
  return fitScale(viewport.width - geometry.side * 2, viewport.height - geometry.top - geometry.bottom)
}
