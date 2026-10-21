import { useEffect, useState } from 'react'
import { computeFitScale, type Viewport } from './fitScale'
import type { Mode } from './types'

function readViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight }
}

/** Fit scale for the active mode; recomputed on viewport resize and mode change. */
export function useFitScale(mode: Mode): number {
  const [viewport, setViewport] = useState<Viewport>(readViewport)
  useEffect(() => {
    const onResize = () => setViewport(readViewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return computeFitScale(mode, viewport)
}
