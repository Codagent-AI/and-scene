import { useLayoutEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT, type PresentationMode } from './constants'
import { computeFitScale } from './fitScale'

/**
 * Scale for the fixed canvas given the stage region (between header and
 * footer). Constant within a mode; switching mode is just a re-render.
 */
export function useFitScale(
  regionRef: RefObject<HTMLElement | null>,
  mode: PresentationMode,
  designW: number = DESIGN_W,
  designH: number = DESIGN_H,
  /** Re-attach measurement when the region element mounts later (e.g. steps load async). */
  enabled = true,
): number {
  const geometry = STAGE_LAYOUT[mode]
  const [size, setSize] = useState<{ w: number; h: number }>(() => ({
    w: typeof window === 'undefined' ? designW : window.innerWidth,
    h: typeof window === 'undefined' ? designH : window.innerHeight,
  }))

  useLayoutEffect(() => {
    const el = regionRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      setSize((s) => (s.w === r.width && s.h === r.height ? s : { w: r.width, h: r.height }))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [regionRef, enabled])

  return computeFitScale(size.w, size.h, geometry, designW, designH)
}
