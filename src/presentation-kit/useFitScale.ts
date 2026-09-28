import { useLayoutEffect, useRef, useState } from 'react'
import { MIN_SCALE, STAGE_LAYOUT, type PresentationMode } from './constants'
import type { CanvasSize } from './types'

/** Uniform scale that fits the design canvas into the measured viewport element. */
export function useFitScale(mode: PresentationMode, canvas: CanvasSize) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { padX, padY, maxScale } = STAGE_LAYOUT[mode]
    const measure = () => {
      const w = el.clientWidth - padX * 2
      const h = el.clientHeight - padY * 2
      if (w <= 0 || h <= 0) return
      const fit = Math.min(w / canvas.width, h / canvas.height)
      setScale(Math.min(maxScale, Math.max(MIN_SCALE, fit)))
    }
    measure()
    window.addEventListener('resize', measure)
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    ro?.observe(el)
    return () => {
      window.removeEventListener('resize', measure)
      ro?.disconnect()
    }
  }, [mode, canvas.width, canvas.height])

  return { ref, scale }
}
