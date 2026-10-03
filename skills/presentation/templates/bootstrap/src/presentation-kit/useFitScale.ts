import { useEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationMode } from './types'

export function useFitScale(mode: PresentationMode, containerRef: RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => {
      const { width, height } = container.getBoundingClientRect()
      setScale(Math.min(1, Math.max(0, width) / DESIGN_W, Math.max(0, height) / DESIGN_H))
    }
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [mode, containerRef])
  return scale
}
