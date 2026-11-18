import { useLayoutEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const inset = STAGE_LAYOUT[mode].inset * 2
  return Math.max(0, Math.min((width - inset) / designW, (height - inset) / designH))
}
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setScale(fitScale(element.clientWidth, element.clientHeight, mode, width, height))
    update(); const observer = new ResizeObserver(update); observer.observe(element)
    return () => observer.disconnect()
  }, [mode, width, height])
  return { ref, scale }
}
