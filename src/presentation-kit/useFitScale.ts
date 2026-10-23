import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { CanvasSize, PresentationMode } from './types'

/** Uniform scale that fits the canvas into the available box, never below MIN_SCALE. */
export function computeFitScale(
  availableWidth: number,
  availableHeight: number,
  mode: PresentationMode,
  canvas: CanvasSize,
): number {
  const { insetX, insetY } = STAGE_LAYOUT[mode]
  const w = Math.max(availableWidth - insetX * 2, 0)
  const h = Math.max(availableHeight - insetY * 2, 0)
  return Math.max(Math.min(w / canvas.width, h / canvas.height), MIN_SCALE)
}

export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  mode: PresentationMode,
  canvas: CanvasSize,
): number {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setScale(computeFitScale(rect.width, rect.height, mode, canvas))
    }
    measure()
    window.addEventListener('resize', measure)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(el)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [ref, mode, canvas])

  return scale
}

/** True while the viewport is at least `minWidth` px wide. */
export function useMinWidth(minWidth: number): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= minWidth)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= minWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [minWidth])
  return wide
}
