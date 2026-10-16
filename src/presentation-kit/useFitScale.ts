import { useLayoutEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export function fitScale(w: number, h: number, mode: Mode, dw = DESIGN_W, dh = DESIGN_H): number {
  const { insetX, insetY } = STAGE_LAYOUT[mode]
  const s = Math.min((w - insetX * 2) / dw, (h - insetY * 2) / dh)
  return Math.max(Number.isFinite(s) ? s : MIN_SCALE, MIN_SCALE)
}

/** Uniform scale fitting the design canvas inside the observed element. */
export function useFitScale(mode: Mode, dw = DESIGN_W, dh = DESIGN_H) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(fitScale(el.clientWidth, el.clientHeight, mode, dw, dh))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode, dw, dh])

  return { ref, scale }
}
