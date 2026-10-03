import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import type { PresentationMode } from './types.ts'

export type FitScaleOptions = {
  availableWidth: number
  availableHeight: number
  mode?: PresentationMode
  canvasWidth?: number
  canvasHeight?: number
  minScale?: number
}

export function calculateFitScale({
  availableWidth,
  availableHeight,
  mode = 'browse',
  canvasWidth = DESIGN_W,
  canvasHeight = DESIGN_H,
  minScale = MIN_SCALE,
}: FitScaleOptions): number {
  const usableHeight = Math.max(0, availableHeight - STAGE_LAYOUT[mode].top - STAGE_LAYOUT[mode].bottom)
  const widthScale = availableWidth > 0 ? availableWidth / canvasWidth : 1
  const heightScale = usableHeight > 0 ? usableHeight / canvasHeight : widthScale
  return Math.max(minScale, Math.min(widthScale, heightScale))
}

export function useFitScale(
  availableWidth: number,
  availableHeight: number,
  mode: PresentationMode,
): number {
  return calculateFitScale({ availableWidth, availableHeight, mode })
}

export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState(() => ({
    width: typeof window === 'undefined' ? DESIGN_W : window.innerWidth,
    height: typeof window === 'undefined' ? DESIGN_H : window.innerHeight,
  }))

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return size
}
