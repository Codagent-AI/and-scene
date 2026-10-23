import { useEffect, useState } from 'react'
import { computeFitScale, type Viewport } from './fit.ts'
import { WIDE_VIEWPORT_PX } from './constants.ts'
import type { Canvas, Mode } from './types.ts'

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

/** True when the viewport is wide enough for the table of contents. */
export function useIsWide(): boolean {
  const { width } = useViewport()
  return width >= WIDE_VIEWPORT_PX
}

export function useFitScale(mode: Mode, showSide: boolean, canvas?: Canvas): number {
  const viewport = useViewport()
  return computeFitScale(viewport, mode, showSide, canvas)
}
