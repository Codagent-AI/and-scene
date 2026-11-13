import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import { DESIGN_W, DESIGN_H } from './constants'
export function fitScale(width: number, height: number, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  return Math.max(0, Math.min(width / designWidth, height / designHeight))
}
export function useFitScale(ref: RefObject<HTMLElement | null>, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => { const rect = element.getBoundingClientRect(); setScale(fitScale(rect.width, rect.height, designWidth, designHeight)) }
    update()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(element); window.addEventListener('resize', update)
    return () => { observer?.disconnect(); window.removeEventListener('resize', update) }
  }, [ref, designWidth, designHeight])
  return scale
}
