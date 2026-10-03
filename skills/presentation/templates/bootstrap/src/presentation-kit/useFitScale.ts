import { useEffect, useState, type RefObject } from 'react'
import { STAGE_LAYOUT } from './constants.ts'
import type { PresentationMode } from './types.ts'

export function useFitScale(ref: RefObject<HTMLElement | null>, mode: PresentationMode, width: number, height: number) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => {
      const bounds = element.getBoundingClientRect()
      const reserve = STAGE_LAYOUT[mode]
      const availableWidth = Math.max(0, bounds.width - reserve.side * 2)
      const availableHeight = Math.max(0, bounds.height - reserve.top - reserve.bottom)
      setScale(Math.max(0, Math.min(1, availableWidth / width, availableHeight / height)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [height, mode, ref, width])
  return scale
}
