import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

function computeScale(mode: PresentationMode): number {
  const insets = STAGE_LAYOUT[mode]
  const availableW = window.innerWidth - insets.left - insets.right
  const availableH = window.innerHeight - insets.top - insets.bottom
  const scale = Math.min(availableW / DESIGN_W, availableH / DESIGN_H)
  return Math.max(MIN_SCALE, scale)
}

export function useFitScale(mode: PresentationMode): number {
  const [scale, setScale] = useState(() => computeScale(mode))

  useEffect(() => {
    function onResize() {
      setScale(computeScale(mode))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [mode])

  return scale
}
