import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, TOC_BREAKPOINT } from './constants.ts'
import type { CanvasSize, Mode } from './types.ts'

export interface Viewport {
  width: number
  height: number
}

export function showsToc(mode: Mode, viewportWidth: number): boolean {
  return mode === 'browse' && viewportWidth >= TOC_BREAKPOINT
}

/** Uniform scale that fits the design canvas into the gap the chrome leaves. */
export function computeFitScale(
  viewport: Viewport,
  mode: Mode,
  canvas: CanvasSize = { width: DESIGN_W, height: DESIGN_H },
): number {
  const g = STAGE_LAYOUT[mode]
  const toc = showsToc(mode, viewport.width) ? g.tocWidth : 0
  const availW = viewport.width - g.side * 2 - toc
  const availH = viewport.height - g.top - g.bottom
  return Math.max(MIN_SCALE, Math.min(availW / canvas.width, availH / canvas.height))
}

export function useViewport(): Viewport {
  const read = (): Viewport => ({ width: window.innerWidth, height: window.innerHeight })
  const [viewport, setViewport] = useState(read)
  useEffect(() => {
    const onResize = () => setViewport(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return viewport
}

export function useFitScale(mode: Mode, canvas?: CanvasSize) {
  const viewport = useViewport()
  return { viewport, scale: computeFitScale(viewport, mode, canvas) }
}
