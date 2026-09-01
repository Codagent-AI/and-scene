import { useEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE } from './constants'

export function fitScaleForSize(width: number, height: number): number {
  if (width <= 0 || height <= 0) return MIN_SCALE
  return Math.max(MIN_SCALE, Math.min(width / DESIGN_W, height / DESIGN_H))
}

export function useFitScale(container: RefObject<HTMLElement | null>): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const element = container.current
    if (!element) return undefined

    const update = () => {
      const { width, height } = element.getBoundingClientRect()
      setScale(fitScaleForSize(width, height))
    }

    update()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [container])

  return scale
}
