import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export interface StageGeometry {
  top: number
  bottom: number
  side: number
}

/** Uniform scale that fits the design canvas into the available box. */
export function computeScale(
  viewportW: number,
  viewportH: number,
  geometry: StageGeometry,
  designW = DESIGN_W,
  designH = DESIGN_H,
) {
  const availW = Math.max(0, viewportW - geometry.side * 2)
  const availH = Math.max(0, viewportH - geometry.top - geometry.bottom)
  return Math.max(MIN_SCALE, Math.min(availW / designW, availH / designH))
}

export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  const [scale, setScale] = useState(() =>
    typeof window === 'undefined'
      ? 1
      : computeScale(window.innerWidth, window.innerHeight, geometry, designW, designH),
  )
  useEffect(() => {
    const update = () =>
      setScale(computeScale(window.innerWidth, window.innerHeight, geometry, designW, designH))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [geometry, designW, designH])
  return scale
}
