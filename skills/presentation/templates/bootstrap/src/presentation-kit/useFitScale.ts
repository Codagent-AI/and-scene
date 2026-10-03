import { useEffect, useState } from 'react'

export function useFitScale(width: number, height: number, top = 0, bottom = 0) {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const availableHeight = Math.max(1, size.height - top - bottom)
  return Math.min(size.width / width, availableHeight / height, 1)
}
