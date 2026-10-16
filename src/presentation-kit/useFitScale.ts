import { useLayoutEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Canvas, Mode } from './types'

export function computeScale(
  availW: number,
  availH: number,
  mode: Mode,
  canvas: Canvas = { width: DESIGN_W, height: DESIGN_H },
): number {
  const { inset, maxScale } = STAGE_LAYOUT[mode]
  const fit = Math.min(
    (availW - inset * 2) / canvas.width,
    (availH - inset * 2) / canvas.height,
  )
  return Math.max(MIN_SCALE, Math.min(maxScale, fit))
}

/** Uniform scale that fits the fixed canvas into the referenced container. */
export function useFitScale(ref: RefObject<HTMLElement | null>, mode: Mode, canvas: Canvas) {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setScale(computeScale(r.width, r.height, mode, canvas))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, mode, canvas])
  return scale
}
