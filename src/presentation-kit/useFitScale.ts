import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants.ts'
import type { Mode } from './types.ts'

export function isWideViewport(width: number): boolean {
  return width >= WIDE_VIEWPORT
}

/** Uniform scale that fits the design canvas into the space the mode's chrome leaves. */
export function fitScale(
  viewportWidth: number,
  viewportHeight: number,
  mode: Mode,
  showToc: boolean,
): number {
  const g = STAGE_LAYOUT[mode]
  const availableW = viewportWidth - 2 * g.side - (showToc ? g.tocWidth : 0)
  const availableH = viewportHeight - g.top - g.bottom
  return Math.max(MIN_SCALE, Math.min(availableW / DESIGN_W, availableH / DESIGN_H))
}

export interface Viewport {
  width: number
  height: number
}

function readViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight }
}

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState(readViewport)
  useEffect(() => {
    const onResize = () => setViewport(readViewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return viewport
}

export function useFitScale(mode: Mode, showToc: boolean): number {
  const { width, height } = useViewport()
  return fitScale(width, height, mode, showToc)
}
