import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  return Math.max(0, Math.min((width - geometry.inset * 2) / designW,
    (height - geometry.top - geometry.bottom) / designH, 1))
}
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const [viewport, setViewport] = useState(() => [window.innerWidth, window.innerHeight])
  useEffect(() => {
    const resize = () => setViewport([window.innerWidth, window.innerHeight])
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return fitScale(viewport[0], viewport[1], mode, designW, designH)
}
