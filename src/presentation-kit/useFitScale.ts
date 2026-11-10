import { useEffect, useState, type RefObject } from 'react'
import { fitScale, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function useFitScale(mode: Mode, stage: RefObject<HTMLDivElement | null>) {
  const [bounds, setBounds] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = stage.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setBounds({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [stage])
  return fitScale(bounds.width - STAGE_LAYOUT[mode].side * 2, bounds.height)
}
