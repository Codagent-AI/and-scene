import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  return Math.max(0, Math.min((width - geometry.horizontal) / designWidth, (height - geometry.vertical) / designHeight, 1))
}
export function useViewport() {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return viewport
}
export function useFitScale(mode: Mode) {
  const { width, height } = useViewport()
  return fitScale(width, height, mode)
}

// Observe the actual flex slot, after host CSS, chrome and margins take their space.
export function useStageScale(ref: RefObject<HTMLElement | null>, fallback: number) {
  const [size, setSize] = useState<{width: number; height: number} | null>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize(previous => previous?.width === width && previous.height === height ? previous : {width, height})
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size ? Math.max(0, Math.min(size.width / DESIGN_W, size.height / DESIGN_H, 1)) : fallback
}
