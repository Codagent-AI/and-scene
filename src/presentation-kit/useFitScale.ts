import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export interface UseFitScaleResult {
  scale: number
  containerRef: RefObject<HTMLDivElement | null>
}

/** Uniform fit-to-viewport scale for the fixed design canvas, per active mode. */
export function useFitScale(
  mode: PresentationMode,
  designWidth: number = DESIGN_W,
  designHeight: number = DESIGN_H,
): UseFitScaleResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function computeScale() {
      const geometry = STAGE_LAYOUT[mode]
      const availableWidth = window.innerWidth - geometry.sidePadding * 2
      const availableHeight =
        window.innerHeight -
        geometry.headerHeight -
        geometry.footerHeight -
        geometry.topPadding -
        geometry.bottomPadding
      const fitted = Math.min(availableWidth / designWidth, availableHeight / designHeight)
      setScale(Number.isFinite(fitted) ? Math.max(MIN_SCALE, fitted) : MIN_SCALE)
    }

    computeScale()
    window.addEventListener('resize', computeScale)
    return () => window.removeEventListener('resize', computeScale)
  }, [mode, designWidth, designHeight])

  return { scale, containerRef }
}
