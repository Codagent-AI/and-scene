import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function fitScale(width: number, height: number, mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  const availableWidth = Math.max(0, width - geometry.horizontal * 2)
  const availableHeight = Math.max(0, height - geometry.top - geometry.bottom)
  return Math.min(availableWidth / designWidth, availableHeight / designHeight, 1)
}

export function useFitScale(mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return fitScale(size.width, size.height, mode, designWidth, designHeight)
}
