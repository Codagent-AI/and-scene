import { useEffect, useState } from 'react'
import { DEFAULT_CANVAS, MIN_SCALE, STAGE_LAYOUT, TOC_WIDTH, WIDE_BREAKPOINT } from './constants'
import type { Canvas, PresentationMode } from './types'

export interface Viewport {
  width: number
  height: number
}

export interface Fit {
  scale: number
  /** The region (viewport px) the canvas is centered in. */
  region: { top: number; bottom: number; left: number; right: number }
}

export function computeFit(
  viewport: Viewport,
  mode: PresentationMode,
  tocVisible: boolean,
  canvas: Canvas = DEFAULT_CANVAS,
): Fit {
  const insets = STAGE_LAYOUT[mode]
  const left = insets.left + (tocVisible ? TOC_WIDTH : 0)
  const availW = Math.max(viewport.width - left - insets.right, 0)
  const availH = Math.max(viewport.height - insets.top - insets.bottom, 0)
  const scale = Math.max(Math.min(availW / canvas.width, availH / canvas.height), MIN_SCALE)
  return { scale, region: { top: insets.top, bottom: insets.bottom, left, right: insets.right } }
}

export function readViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight }
}

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState(readViewport)
  useEffect(() => {
    const onResize = () => setViewport(readViewport())
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return viewport
}

export interface FitState extends Fit {
  wide: boolean
  tocVisible: boolean
}

export function useFitScale(mode: PresentationMode, canvas: Canvas = DEFAULT_CANVAS): FitState {
  const viewport = useViewport()
  const wide = viewport.width >= WIDE_BREAKPOINT
  const tocVisible = mode === 'browse' && wide
  return { ...computeFit(viewport, mode, tocVisible, canvas), wide, tocVisible }
}
