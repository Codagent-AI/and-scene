import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT, type StageGeometry } from './constants'
import type { Mode } from './types'

export interface Insets {
  top: number
  bottom: number
  side: number
}

export function stageInsets(
  mode: Mode,
  viewportWidth: number,
  layout: Record<Mode, StageGeometry> = STAGE_LAYOUT,
): Insets {
  const g = layout[mode]
  const tocShown = mode === 'browse' && viewportWidth >= WIDE_VIEWPORT
  return { top: g.top, bottom: g.bottom, side: tocShown ? g.tocSide : g.side }
}

/** One uniform factor for both axes; depends only on viewport, mode and canvas. */
export function computeFitScale(args: {
  viewportWidth: number
  viewportHeight: number
  mode: Mode
  designWidth?: number
  designHeight?: number
  layout?: Record<Mode, StageGeometry>
}): number {
  const { viewportWidth, viewportHeight, mode, designWidth = DESIGN_W, designHeight = DESIGN_H, layout } = args
  const insets = stageInsets(mode, viewportWidth, layout)
  const availW = viewportWidth - insets.side * 2
  const availH = viewportHeight - insets.top - insets.bottom
  return Math.max(MIN_SCALE, Math.min(availW / designWidth, availH / designHeight))
}

export function useViewportSize(): { width: number; height: number } {
  const read = () => ({ width: window.innerWidth, height: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export function useFitScale(
  mode: Mode,
  options: { designWidth?: number; designHeight?: number; layout?: Record<Mode, StageGeometry> } = {},
): number {
  const { width, height } = useViewportSize()
  return computeFitScale({ viewportWidth: width, viewportHeight: height, mode, ...options })
}
