import { useEffect, useState } from 'react'
import {
  DESIGN_H,
  DESIGN_W,
  MIN_SCALE,
  STAGE_LAYOUT,
  TOC_WIDTH,
  WIDE_MIN_WIDTH,
  type Mode,
  type StageGeometry,
} from './constants'

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

export function isWide(viewport: Viewport): boolean {
  return viewport.width >= WIDE_MIN_WIDTH
}

/** Space reserved around the canvas for the given mode and viewport. */
export function stageGeometry(mode: Mode, viewport: Viewport): StageGeometry {
  const base = STAGE_LAYOUT[mode]
  if (mode === 'browse' && isWide(viewport)) return { ...base, left: base.left + TOC_WIDTH }
  return base
}

/** Uniform scale that fits the design canvas into the viewport minus the mode's reserved space. */
export function computeFitScale(viewport: Viewport, geometry: StageGeometry): number {
  const availableW = viewport.width - geometry.left - geometry.right
  const availableH = viewport.height - geometry.top - geometry.bottom
  return Math.max(MIN_SCALE, Math.min(availableW / DESIGN_W, availableH / DESIGN_H))
}

export function useFitScale(mode: Mode): { scale: number; geometry: StageGeometry } {
  const viewport = useViewport()
  const geometry = stageGeometry(mode, viewport)
  return { scale: computeFitScale(viewport, geometry), geometry }
}
