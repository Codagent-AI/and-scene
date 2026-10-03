import { useEffect, useState } from 'react'

export function useFitScale(width: number, height: number, mode: 'browse' | 'present') {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('Design dimensions must be finite positive numbers')
  }
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const verticalChrome = mode === 'browse' ? 230 : 120
  const horizontalScale = Math.max(1, viewport.width - 32) / width
  const availableHeight = viewport.height - verticalChrome
  return Math.min(horizontalScale, availableHeight > 0 ? availableHeight / height : horizontalScale, 1)
}
