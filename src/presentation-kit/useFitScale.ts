import { useEffect, useState } from 'react'

export function useFitScale(width: number, height: number, mode: 'browse' | 'present') {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const verticalChrome = mode === 'browse' ? 230 : 120
  return Math.min((viewport.width - 32) / width, (viewport.height - verticalChrome) / height, 1)
}
