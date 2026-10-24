import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT, type Mode } from './constants'

export interface Viewport {
  width: number
  height: number
}

export const isWide = (width: number) => width >= WIDE_VIEWPORT

/** Pixels left of the canvas that chrome reserves in this mode (side gutter plus table of contents). */
export function stageInsets(mode: Mode, width: number) {
  const g = STAGE_LAYOUT[mode]
  const toc = mode === 'browse' && isWide(width) ? g.tocWidth : 0
  return { top: g.top, bottom: g.bottom, left: g.side + toc, right: g.side }
}

/**
 * One uniform scale for both axes: the smaller of the width and height ratios.
 * Depends only on viewport, mode, and canvas, never on the active step.
 */
export function computeFitScale(
  { width, height }: Viewport,
  mode: Mode,
  canvas = { width: DESIGN_W, height: DESIGN_H },
) {
  const inset = stageInsets(mode, width)
  const sx = (width - inset.left - inset.right) / canvas.width
  const sy = (height - inset.top - inset.bottom) / canvas.height
  return Math.max(MIN_SCALE, Math.min(sx, sy))
}

const read = (): Viewport => ({ width: window.innerWidth, height: window.innerHeight })

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState(read)
  useEffect(() => {
    const onResize = () => setViewport(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return viewport
}

export function useFitScale(mode: Mode, canvas?: { width: number; height: number }) {
  const viewport = useViewport()
  return computeFitScale(viewport, mode, canvas)
}
