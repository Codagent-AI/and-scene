import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.js'

export function fitScale(width: number, height: number, mode: 'browse' | 'present', designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min(1, (width - geometry.horizontal * 2) / designWidth, (height - geometry.top - geometry.bottom) / designHeight))
}

export function useFitScale(mode: 'browse' | 'present', designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return fitScale(size.width, size.height, mode, designWidth, designHeight)
}
