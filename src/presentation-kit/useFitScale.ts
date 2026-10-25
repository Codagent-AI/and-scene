import { useLayoutEffect, useRef, useState } from 'react'
import { computeFitScale, DEFAULT_CANVAS, type CanvasSize } from './fit.ts'
import type { Mode } from './types.ts'

/** Measures the stage container and returns the uniform scale for the active mode. */
export function useFitScale(mode: Mode, canvas: CanvasSize = DEFAULT_CANVAS) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const { width, height } = canvas

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setScale(computeFitScale(rect, mode, { width, height }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode, width, height])

  return { ref, scale }
}
