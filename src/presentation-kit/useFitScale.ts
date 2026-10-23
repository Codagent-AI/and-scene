import { useEffect, useState, type RefObject } from 'react'
import { MIN_SCALE } from './constants'

export interface FitGeometry {
  width: number
  height: number
  padding: number
}

/** Uniform scale that fits the design canvas inside the available box, never below MIN_SCALE. */
export function computeFitScale(available: { width: number; height: number }, geometry: FitGeometry): number {
  const usableW = available.width - geometry.padding * 2
  const usableH = available.height - geometry.padding * 2
  const fit = Math.min(usableW / geometry.width, usableH / geometry.height)
  return Math.max(MIN_SCALE, fit)
}

export function useFitScale(ref: RefObject<HTMLElement | null>, geometry: FitGeometry): number {
  const [scale, setScale] = useState(MIN_SCALE)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      setScale(computeFitScale({ width: rect.width, height: rect.height }, geometry))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [ref, geometry])

  return scale
}
