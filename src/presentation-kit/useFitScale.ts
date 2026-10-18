import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import { computeFitScale } from './fit'
import type { PresentationMode } from './constants'
import { MIN_SCALE } from './constants'

/** Tracks the element's box and returns the uniform canvas scale for the mode. */
export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  mode: PresentationMode,
): number {
  const [scale, setScale] = useState(MIN_SCALE)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => {
      const { width, height } = element.getBoundingClientRect()
      setScale(computeFitScale(width, height, mode))
    }
    measure()
    window.addEventListener('resize', measure)
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(element)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [ref, mode])

  return scale
}
