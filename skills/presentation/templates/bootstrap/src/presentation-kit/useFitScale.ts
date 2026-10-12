import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, NARROW_STAGE_MARGIN, NARROW_STAGE_WIDTH, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export function calculateFitScale(
  width: number,
  height: number,
  mode: PresentationMode,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
) {
  const geometry = STAGE_LAYOUT[mode]
  const horizontal = width < NARROW_STAGE_WIDTH ? Math.min(geometry.horizontal, NARROW_STAGE_MARGIN) : geometry.horizontal
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
