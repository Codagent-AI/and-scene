import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import type { PresentationMode } from './types.ts'

export interface ViewportSize {
  width: number
  height: number
}

/** One uniform scale factor: the canvas fits the space left by the chrome. */
export function computeFitScale(
  viewport: ViewportSize,
  mode: PresentationMode,
  design: ViewportSize = { width: DESIGN_W, height: DESIGN_H },
): number {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const availableWidth = viewport.width - side * 2
  const availableHeight = viewport.height - top - bottom
  return Math.max(
    MIN_SCALE,
    Math.min(availableWidth / design.width, availableHeight / design.height),
  )
}

const readViewport = (): ViewportSize => ({
  width: window.innerWidth,
  height: window.innerHeight,
})

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState(readViewport)
  useEffect(() => {
    const onResize = () => setSize(readViewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export function useFitScale(mode: PresentationMode): number {
  return computeFitScale(useViewportSize(), mode)
}
