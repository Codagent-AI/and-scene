import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { MIN_SCALE } from './constants'

export function fitScale(width: number, height: number, designWidth: number, designHeight: number) {
  return Math.max(MIN_SCALE, Math.min(width / designWidth, height / designHeight, 1))
}

export function useFitScale(
  viewport: RefObject<HTMLElement | null>,
  designWidth: number,
  designHeight: number,
) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const element = viewport.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([{ contentRect }]) => {
      setScale(fitScale(contentRect.width, contentRect.height, designWidth, designHeight))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [viewport, designWidth, designHeight])

  return scale
}
