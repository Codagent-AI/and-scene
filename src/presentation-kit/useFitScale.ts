import { useCallback, useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function fitScale(
  width: number,
  height: number,
  mode: PresentationMode,
): number {
  const layout = STAGE_LAYOUT[mode]
  return Math.max(
    MIN_SCALE,
    Math.min(
      (width - layout.reservedWidth) / DESIGN_W,
      (height - layout.reservedHeight) / DESIGN_H,
    ),
  )
}

export function useFitScale(mode: PresentationMode): number {
  const getScale = useCallback(() => fitScale(window.innerWidth, window.innerHeight, mode), [mode])
  const [scale, setScale] = useState(getScale)

  useEffect(() => {
    const resize = () => setScale(getScale())
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [getScale])

  return scale
}
