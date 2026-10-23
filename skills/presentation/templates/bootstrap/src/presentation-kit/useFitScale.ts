import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT_MIN, type Mode } from './constants'
import type { Canvas } from './types'

export interface Viewport {
  width: number
  height: number
}

const DEFAULT_CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }

/** Uniform scale that fits the canvas in the space left by the mode's chrome. */
export function fitScale(viewport: Viewport, mode: Mode, canvas: Canvas = DEFAULT_CANVAS): number {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const availW = viewport.width - side * 2
  const availH = viewport.height - top - bottom
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

export function useFitScale(mode: Mode, canvas: Canvas = DEFAULT_CANVAS): number {
  return fitScale(useViewport(), mode, canvas)
}

export function useIsWide(): boolean {
  return useViewport().width >= WIDE_VIEWPORT_MIN
}
