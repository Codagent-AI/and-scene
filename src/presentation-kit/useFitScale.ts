import { useLayoutEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, type Mode } from './constants'

/** Uniform scale that fits the design canvas into the available box for a mode. */
export function computeFitScale(
  width: number,
  height: number,
  mode: Mode,
  design: { width: number; height: number } = { width: DESIGN_W, height: DESIGN_H },
): number {
  const { insetX, insetY, maxScale } = STAGE_LAYOUT[mode]
  const fit = Math.min((width - insetX * 2) / design.width, (height - insetY * 2) / design.height)
  return Math.min(maxScale, Math.max(MIN_SCALE, fit))
}

/** Measures the stage box and returns the uniform scale for the active mode. */
export function useFitScale(mode: Mode, design?: { width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const designW = design?.width ?? DESIGN_W
  const designH = design?.height ?? DESIGN_H

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setScale(computeFitScale(width, height, mode, { width: designW, height: designH }))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(el)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [mode, designW, designH])

  return { ref, scale }
}
