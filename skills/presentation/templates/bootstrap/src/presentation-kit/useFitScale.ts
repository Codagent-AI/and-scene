import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

const MIN_GUTTER = 16

/** Uniform scale that fits the design canvas in the viewport; side gutters shrink on narrow viewports. */
export function computeFitScale(mode: PresentationMode, viewportWidth: number, viewportHeight: number, width = DESIGN_W, height = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  const gutter = Math.min(geometry.horizontal, Math.max(MIN_GUTTER, (viewportWidth - 320) / 10))
  const availableWidth = Math.max(0, viewportWidth - gutter * 2)
  const availableHeight = Math.max(0, viewportHeight - geometry.top - geometry.bottom)
  return Math.min(1, availableWidth / width, availableHeight / height)
}

export function useFitScale(mode: PresentationMode, width = DESIGN_W, height = DESIGN_H) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      setScale(computeFitScale(mode, window.innerWidth, window.innerHeight, width, height))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode, width, height])
  return scale
}
