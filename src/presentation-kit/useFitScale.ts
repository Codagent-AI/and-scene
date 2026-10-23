import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import { MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Canvas, Mode } from './constants'

export function computeFitScale(
  available: { width: number; height: number },
  canvas: Canvas,
  inset: number,
): number {
  const w = (available.width - inset * 2) / canvas.width
  const h = (available.height - inset * 2) / canvas.height
  const scale = Math.min(w, h)
  return Number.isFinite(scale) ? Math.max(MIN_SCALE, scale) : MIN_SCALE
}

/** Uniform fit scale of `canvas` into the element behind `ref`. */
export function useFitScale(ref: RefObject<HTMLElement | null>, canvas: Canvas, mode: Mode): number {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return computeFitScale(size, canvas, STAGE_LAYOUT[mode].inset)
}
