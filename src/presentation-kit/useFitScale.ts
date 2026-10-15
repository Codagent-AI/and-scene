import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, type Mode } from './constants'
import { computeFitScale } from './fitScale'

/** Uniform scale fitting the design canvas into the ref'd area for the given mode. */
export function useFitScale(mode: Mode) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { insetX, insetY } = STAGE_LAYOUT[mode]
    const rect = el.getBoundingClientRect()
    setScale(
      computeFitScale(rect.width - insetX * 2, rect.height - insetY * 2, DESIGN_W, DESIGN_H, MIN_SCALE),
    )
  }, [mode])

  useLayoutEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    const el = ref.current
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(measure) : null
    if (ro && el) ro.observe(el)
    return () => {
      window.removeEventListener('resize', measure)
      ro?.disconnect()
    }
  }, [measure])

  return { ref, scale }
}
