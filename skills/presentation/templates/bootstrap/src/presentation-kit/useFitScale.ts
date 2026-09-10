import { useEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function fitScale(width: number, height: number, mode: PresentationMode) {
  const geometry = STAGE_LAYOUT[mode]
  const usableWidth = Math.max(0, width)
  const usableHeight = Math.max(0, height - geometry.reservedTop - geometry.reservedBottom)
  return Math.max(MIN_SCALE, Math.min(usableWidth / DESIGN_W, usableHeight / DESIGN_H))
}

export function useFitScale(container: RefObject<HTMLElement | null>, mode: PresentationMode) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const element = container.current
    if (!element) return undefined
    const update = () => setScale(fitScale(element.clientWidth, element.clientHeight, mode))
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [container, mode])

  return scale
}
