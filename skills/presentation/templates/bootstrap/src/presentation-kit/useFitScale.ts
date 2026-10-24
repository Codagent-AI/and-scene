import { useLayoutEffect, useState, type RefObject } from 'react'
import { computeFitScale, type Size } from './fitScale'
import { MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

/** Tracks the stage area's size and returns the uniform scale for the active mode. */
export function useFitScale(ref: RefObject<HTMLElement | null>, canvas: Size, mode: Mode): number {
  const [size, setSize] = useState<Size>({ width: canvas.width, height: canvas.height })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSize((prev) =>
        prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height },
      )
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  const { inset, maxScale } = STAGE_LAYOUT[mode]
  return computeFitScale(size, canvas, inset, MIN_SCALE, maxScale)
}
