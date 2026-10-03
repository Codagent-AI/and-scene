import { useEffect, useState } from 'react'
import { STAGE_LAYOUT } from './constants'

export function useFitScale(width: number, height: number, mode: 'browse' | 'present') {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const geometry = STAGE_LAYOUT[mode]
  const scale = Math.min(1, Math.max(0.05, Math.min((viewport.width - geometry.side * 2) / width, (viewport.height - geometry.top - geometry.bottom) / height)))
  return scale
}
