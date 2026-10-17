import { useLayoutEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import type { Mode } from './types.ts'

/** Uniform scale that fits the design canvas into an area, for the given mode. */
export function computeScale(width: number, height: number, mode: Mode): number {
  const { padX, padY } = STAGE_LAYOUT[mode]
  const fit = Math.min((width - 2 * padX) / DESIGN_W, (height - 2 * padY) / DESIGN_H)
  return Math.max(MIN_SCALE, fit)
}

export function useFitScale(mode: Mode) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setScale(computeScale(el.clientWidth, el.clientHeight, mode))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode])

  return { ref, scale }
}
