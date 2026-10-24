import { useEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import { computeFitScale } from './model.ts'
import type { Mode } from './types.ts'

/** Uniform scale that fits the design canvas into the viewport element for the active mode. */
export function useFitScale(
  viewport: RefObject<HTMLElement | null>,
  mode: Mode,
  designW = DESIGN_W,
  designH = DESIGN_H,
) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const measure = () =>
      setScale(computeFitScale(el.clientWidth, el.clientHeight, mode, designW, designH))
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [viewport, mode, designW, designH])

  return scale
}
