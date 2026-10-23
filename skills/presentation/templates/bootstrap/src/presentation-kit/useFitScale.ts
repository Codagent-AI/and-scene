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
 * Measures the stage area and returns the fit scale. It is re-measured when the window or
 * the viewport-sized presentation root is resized, when the mode or canvas changes, and when
 * `layoutKey` changes (a responsive layout change that moves the stage, such as the table of
 * contents appearing). It is never re-measured because navigation made a caption or title
 * wrap differently, so every step of a viewport and mode shares one scale.
 */
export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  mode: Mode,
  canvas: Canvas = DEFAULT_CANVAS,
  layoutKey?: unknown,
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
    let frame = 0
    // The window event can arrive before the responsive layout has settled: measure again after it.
    const onResize = () => {
      measure()
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    window.addEventListener('resize', onResize)
    // The root is sized by the viewport alone, so observing it ignores content-driven stage changes.
    const root = el.closest('[data-presentation-root]')
    const observer = root && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (root) observer?.observe(root)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [ref, mode, width, height, layoutKey])

  return scale
}
