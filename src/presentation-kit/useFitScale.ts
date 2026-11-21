import { useLayoutEffect, useRef, useState } from 'react'
import { STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

export function fitScale(availableWidth: number, availableHeight: number, width: number, height: number, mode: Mode) {
  const { inlineInset, blockInset } = STAGE_LAYOUT[mode]
  return Math.max(0, Math.min(
    (availableWidth - 2 * inlineInset) / width,
    (availableHeight - 2 * blockInset) / height,
  ))
}

export function useFitScale(width: number, height: number, mode: Mode) {
  const area = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const element = area.current
    if (!element) return

    const measure = () => {
      setScale(fitScale(element.clientWidth, element.clientHeight, width, height, mode))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [width, height, mode])

  return { area, scale }
}
