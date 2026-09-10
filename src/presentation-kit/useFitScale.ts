import { useLayoutEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function useFitScale(element: HTMLElement | null, mode: PresentationMode) {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    if (!element) return
    const fit = () => {
      const geometry = STAGE_LAYOUT[mode]
      const width = Math.max(1, element.clientWidth - geometry.horizontalInset * 2)
      const height = Math.max(1, element.clientHeight - geometry.verticalInset * 2)
      setScale(Math.max(MIN_SCALE, Math.min(width / DESIGN_W, height / DESIGN_H)))
    }
    fit()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', fit)
      return () => window.removeEventListener('resize', fit)
    }
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, mode])

  return scale
}
