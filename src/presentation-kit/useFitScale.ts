import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants'
import type { StageGeometry } from './constants'
import type { PresentationMode } from './types'

/** Largest uniform scale that fits the design canvas into the available box. */
export function computeFitScale(
  availW: number,
  availH: number,
  designW = DESIGN_W,
  designH = DESIGN_H,
  minScale = MIN_SCALE,
): number {
  const scale = Math.min(availW / designW, availH / designH)
  return Number.isFinite(scale) ? Math.max(scale, minScale) : minScale
}

export function stageInsets(mode: PresentationMode, viewportW: number): StageGeometry & { left: number } {
  const g = STAGE_LAYOUT[mode]
  const showToc = mode === 'browse' && viewportW >= WIDE_VIEWPORT
  return { ...g, left: g.side + (showToc ? g.toc : 0) }
}

export function fitScaleFor(
  mode: PresentationMode,
  viewportW: number,
  viewportH: number,
  designW = DESIGN_W,
  designH = DESIGN_H,
): number {
  const g = stageInsets(mode, viewportW)
  return computeFitScale(
    viewportW - g.left - g.side,
    viewportH - g.top - g.bottom,
    designW,
    designH,
  )
}

export function useFitScale(mode: PresentationMode, designW = DESIGN_W, designH = DESIGN_H) {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return {
    scale: fitScaleFor(mode, size.w, size.h, designW, designH),
    viewportW: size.w,
  }
}
