import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

function computeScale(mode: PresentationMode): number {
  const gap = STAGE_LAYOUT[mode]
  const availWidth = window.innerWidth
  const availHeight = window.innerHeight - gap.topGap - gap.bottomGap
  const scale = Math.min(availWidth / DESIGN_W, availHeight / DESIGN_H)
  return Math.max(MIN_SCALE, scale)
}

/** Uniform scale factor to fit the fixed design canvas within the active mode's chrome gap. */
export function useFitScale(mode: PresentationMode): number {
  const [scale, setScale] = useState(() => computeScale(mode))

  useEffect(() => {
    function handleResize() {
      setScale(computeScale(mode))
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mode])

  return scale
}
