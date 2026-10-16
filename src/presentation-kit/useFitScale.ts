import { useLayoutEffect, useState, type RefObject } from 'react'
import { computeFitScale } from './fit.ts'
import type { Mode } from './types.ts'

/** Tracks the box of `ref` and returns the uniform scale for the active mode's stage geometry. */
export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  mode: Mode,
  design?: { width: number; height: number },
): number {
  const [scale, setScale] = useState(1)
  const width = design?.width
  const height = design?.height
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const d = width && height ? { width, height } : undefined
    const update = () => setScale(computeFitScale(el.clientWidth, el.clientHeight, mode, d))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, mode, width, height])
  return scale
}
