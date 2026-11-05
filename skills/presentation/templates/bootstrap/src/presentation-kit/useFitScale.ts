import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, canvasWidth = DESIGN_W, canvasHeight = DESIGN_H) {
  const layout = STAGE_LAYOUT[mode]
  return Math.max(MIN_SCALE, Math.min((width - layout.horizontal) / canvasWidth, (height - layout.vertical) / canvasHeight, 1))
}
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const [size, setSize] = useState(() => [window.innerWidth, window.innerHeight])
  useEffect(() => { const resize = () => setSize([window.innerWidth, window.innerHeight]); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize) }, [])
  return fitScale(size[0], size[1], mode, width, height)
}
