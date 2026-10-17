import { useCallback, useSyncExternalStore, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Canvas, Mode } from './types'

/** Uniform scale that fits the canvas into the available box for a mode. */
export function computeFitScale(
  availableW: number,
  availableH: number,
  mode: Mode,
  canvas: Canvas = { width: DESIGN_W, height: DESIGN_H },
): number {
  const { padX, padY } = STAGE_LAYOUT[mode]
  const fit = Math.min(
    (availableW - 2 * padX) / canvas.width,
    (availableH - 2 * padY) / canvas.height,
  )
  return Math.max(MIN_SCALE, fit)
}

/** Fit scale for the element in `ref`, recomputed on resize and mode change. */
export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  mode: Mode,
  canvas?: Canvas,
): number {
  const subscribe = useCallback(
    (notify: () => void) => {
      const element = ref.current
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(notify)
      if (element) observer?.observe(element)
      window.addEventListener('resize', notify)
      return () => {
        observer?.disconnect()
        window.removeEventListener('resize', notify)
      }
    },
    [ref],
  )
  const size = useSyncExternalStore(subscribe, () => {
    const element = ref.current
    return element ? `${element.clientWidth}x${element.clientHeight}` : '0x0'
  })
  const [w, h] = size.split('x').map(Number)
  return computeFitScale(w, h, mode, canvas)
}
