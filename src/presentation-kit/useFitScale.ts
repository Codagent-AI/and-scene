import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

/**
 * Computes the uniform scale factor that fits the fixed DESIGN_W x DESIGN_H
 * canvas into the viewport space left over after the active mode's chrome,
 * so the composition never reflows internally.
 */
export function useFitScale(mode: PresentationMode): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function recompute() {
      const layout = STAGE_LAYOUT[mode]
      const availableW = window.innerWidth - layout.sideMargin * 2
      const availableH = window.innerHeight - layout.headerSpace - layout.footerSpace
      const next = Math.min(availableW / DESIGN_W, availableH / DESIGN_H, 1)
      setScale(Math.max(next, MIN_SCALE))
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [mode])

  return scale
}
