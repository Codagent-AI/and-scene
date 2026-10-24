import { useSyncExternalStore } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { CanvasSize, PresentationMode } from './types'

export function tocVisible(mode: PresentationMode, viewportWidth: number): boolean {
  const g = STAGE_LAYOUT[mode]
  return g.tocWidth > 0 && viewportWidth >= g.tocMinViewport
}

/** Uniform scale that fits the design canvas into the mode's stage area. */
export function computeFitScale(
  viewportWidth: number,
  viewportHeight: number,
  mode: PresentationMode,
  canvas: CanvasSize = { width: DESIGN_W, height: DESIGN_H },
): number {
  const g = STAGE_LAYOUT[mode]
  const toc = tocVisible(mode, viewportWidth) ? g.tocWidth : 0
  const availW = viewportWidth - toc - g.side * 2
  const availH = viewportHeight - g.top - g.bottom
  const scale = Math.min(availW / canvas.width, availH / canvas.height)
  return Math.max(MIN_SCALE, scale)
}

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

const snapshot = () => `${window.innerWidth}x${window.innerHeight}`

export function useViewport(): { width: number; height: number } {
  const key = useSyncExternalStore(subscribe, snapshot, () => '1280x720')
  const [width, height] = key.split('x').map(Number)
  return { width, height }
}

export function useFitScale(mode: PresentationMode, canvas?: CanvasSize): number {
  const { width, height } = useViewport()
  return computeFitScale(width, height, mode, canvas)
}
