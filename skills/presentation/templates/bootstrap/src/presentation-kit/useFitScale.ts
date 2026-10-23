import { useLayoutEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import type { Canvas, Mode } from './types.ts'

const DEFAULT_CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }

/** One uniform scale that fits the canvas into the available area for a mode. */
export function computeFitScale(
  available: { width: number; height: number },
  mode: Mode,
  canvas: Canvas = DEFAULT_CANVAS,
): number {
  const { insetX, insetY } = STAGE_LAYOUT[mode]
  const w = Math.max(0, available.width - insetX * 2)
  const h = Math.max(0, available.height - insetY * 2)
  return Math.max(MIN_SCALE, Math.min(w / canvas.width, h / canvas.height))
}

/**
 * Measures the stage area and returns the fit scale. The scale depends only on the
 * area size, the mode and the canvas, never on the active step.
 */
export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  mode: Mode,
  canvas: Canvas = DEFAULT_CANVAS,
): number {
  const [scale, setScale] = useState(1)
  const { width, height } = canvas

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setScale(computeFitScale({ width: rect.width, height: rect.height }, mode, { width, height }))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, mode, width, height])

  return scale
}
