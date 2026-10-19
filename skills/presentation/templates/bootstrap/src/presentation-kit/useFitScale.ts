import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Canvas, Mode } from './types'

export interface Viewport {
  width: number
  height: number
}

/** Uniform scale that fits the design canvas into the viewport minus the mode's insets. */
export function computeFitScale(
  viewport: Viewport,
  mode: Mode,
  canvas: Canvas = { width: DESIGN_W, height: DESIGN_H },
): number {
  const g = STAGE_LAYOUT[mode]
  const availW = viewport.width - g.insetX * 2
  const availH = viewport.height - g.insetTop - g.insetBottom
  return Math.max(MIN_SCALE, Math.min(availW / canvas.width, availH / canvas.height))
}

const readViewport = (): Viewport => ({ width: window.innerWidth, height: window.innerHeight })

export function useFitScale(mode: Mode, canvas?: Canvas): number {
  const [viewport, setViewport] = useState<Viewport>(readViewport)
  useEffect(() => {
    const onResize = () => setViewport(readViewport())
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return computeFitScale(viewport, mode, canvas)
}
