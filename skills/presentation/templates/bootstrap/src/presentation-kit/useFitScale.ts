import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, MIN_STAGE_MARGIN, STAGE_LAYOUT, STAGE_MARGIN_RATIO } from './constants'
import type { PresentationMode } from './types'

export function calculateFitScale(
  width: number,
  height: number,
  mode: PresentationMode,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
) {
  const geometry = STAGE_LAYOUT[mode]
  const horizontal = Math.min(geometry.horizontal, Math.max(MIN_STAGE_MARGIN, width * STAGE_MARGIN_RATIO))
  const availableWidth = Math.max(0, width - horizontal * 2)
  const availableHeight = Math.max(0, height - geometry.vertical)
  return Math.max(MIN_SCALE, Math.min(1, availableWidth / designWidth, availableHeight / designHeight))
}

export function useFitScale(container: HTMLElement | null, mode: PresentationMode) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    if (!container) return
    const update = () => {
      const rect = container.getBoundingClientRect()
      setScale(calculateFitScale(rect.width, rect.height, mode))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [container, mode])
  return scale
}
