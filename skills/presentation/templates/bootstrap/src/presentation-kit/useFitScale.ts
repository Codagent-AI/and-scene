import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MAX_SCALE, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import type { Mode } from './types.ts'

/** Uniform scale that fits the design canvas into the available box. */
export function computeFitScale(
  availW: number,
  availH: number,
  mode: Mode,
  designW = DESIGN_W,
  designH = DESIGN_H,
): number {
  const { padX, padY } = STAGE_LAYOUT[mode]
  const scale = Math.min((availW - padX) / designW, (availH - padY) / designH)
  if (!Number.isFinite(scale)) return 1
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
}

/** Measures the stage area and returns the uniform scale for the active mode. */
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const areaRef: RefObject<HTMLDivElement | null> = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) setScale(computeFitScale(width, height, mode, designW, designH))
    }
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode, designW, designH])

  return { areaRef, scale }
}
