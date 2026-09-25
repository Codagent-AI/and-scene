import { useEffect, useState } from 'react'

export function useFitScale(width: number, height: number, mode: 'browse' | 'present') {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const top = mode === 'browse' ? 88 : 72
  const bottom = mode === 'browse' ? 154 : 76
  const side = 40
  return Math.min(1, Math.max(0.1, Math.min((viewport.width - side * 2) / width, (viewport.height - top - bottom) / height)))
}
