import { useSyncExternalStore } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT_MIN } from './constants'
import type { Mode } from './types'

export interface StageInsets {
  top: number
  bottom: number
  left: number
  right: number
}

/** Gap the stage occupies between header and footer; the browse ToC rail takes space on wide viewports. */
export function stageInsets(mode: Mode, wide: boolean): StageInsets {
  const { top, bottom, left, right, tocWidth } = STAGE_LAYOUT[mode]
  return { top, bottom, left: left + (mode === 'browse' && wide ? tocWidth : 0), right }
}

/** Uniform scale that fits the design canvas into the stage gap. */
export function computeFitScale(
  viewportW: number,
  viewportH: number,
  insets: StageInsets,
  designW = DESIGN_W,
  designH = DESIGN_H,
  minScale = MIN_SCALE,
): number {
  const w = viewportW - insets.left - insets.right
  const h = viewportH - insets.top - insets.bottom
  return Math.max(minScale, Math.min(w / designW, h / designH))
}

function subscribe(cb: () => void) {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}

export function useViewportSize(): { width: number; height: number } {
  const width = useSyncExternalStore(subscribe, () => window.innerWidth, () => DESIGN_W)
  const height = useSyncExternalStore(subscribe, () => window.innerHeight, () => DESIGN_H)
  return { width, height }
}

export function isWideViewport(width: number): boolean {
  return width >= WIDE_VIEWPORT_MIN
}

/** Scale is constant within a mode; it changes only on resize or mode switch. */
export function useFitScale(mode: Mode): number {
  const { width, height } = useViewportSize()
  return computeFitScale(width, height, stageInsets(mode, isWideViewport(width)))
}
