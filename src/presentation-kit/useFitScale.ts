import { useLayoutEffect, useState, type RefObject } from 'react'
import { STAGE_LAYOUT } from './constants'
import { computeFit, type Fit } from './fit'
import type { Mode } from './types'

/** Measures the stage region and fits the design canvas into it for the given mode. */
export function useFitScale(
  regionRef: RefObject<HTMLElement | null>,
  mode: Mode,
  tocVisible: boolean,
): Fit {
  const [fit, setFit] = useState<Fit>({ scale: 1, x: 0, y: 0 })

  useLayoutEffect(() => {
    const el = regionRef.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      const next = computeFit(width, height, STAGE_LAYOUT[mode], tocVisible)
      setFit((prev) =>
        prev.scale === next.scale && prev.x === next.x && prev.y === next.y ? prev : next,
      )
    }
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure)
      ro.observe(el)
      return () => ro.disconnect()
    }
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [regionRef, mode, tocVisible])

  return fit
}
