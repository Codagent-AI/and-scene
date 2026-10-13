import { useEffect, useState } from 'react'
import { STAGE_LAYOUT } from './constants'

export function useFitScale(width: number, height: number, mode: 'browse' | 'present') {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      const { top, bottom, side } = STAGE_LAYOUT[mode]
      setScale(Math.max(0.15, Math.min(1, (window.innerWidth - side * 2) / width, (window.innerHeight - top - bottom) / height)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [width, height, mode])
  return scale
}
