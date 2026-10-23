import { useLayoutEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export interface Size {
  width: number
  height: number
}

/**
 * Uniform scale that fits a canvas for a mode. `available.width` is the stage's width;
 * `available.height` is the viewport height, less the mode's fixed chrome budget.
 */
export function fitScale(
  available: Size,
  mode: Mode,
  canvasWidth: number = DESIGN_W,
  canvasHeight: number = DESIGN_H,
): number {
  const { padX, padY, reservedHeight } = STAGE_LAYOUT[mode]
  const byWidth = (available.width - 2 * padX) / canvasWidth
  const byHeight = (available.height - reservedHeight - 2 * padY) / canvasHeight
  return Math.max(MIN_SCALE, Math.min(byWidth, byHeight))
}

/** Tracks the fit scale of the element behind `ref`, recomputing on resize. */
export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  mode: Mode,
  canvasWidth: number = DESIGN_W,
  canvasHeight: number = DESIGN_H,
): number {
  const [scale, setScale] = useState(MIN_SCALE)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    // Width comes from the stage; height comes from the viewport. The stage's height would change
    // with caption wrapping, which would change the scale between steps.
    const measure = () =>
      setScale(fitScale({ width: element.clientWidth, height: window.innerHeight }, mode, canvasWidth, canvasHeight))
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, mode, canvasWidth, canvasHeight])

  return scale
}
