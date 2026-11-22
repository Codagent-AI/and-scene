import { useEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'

export function fitScale(
  width: number,
  height: number,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
) {
  return Math.max(0, Math.min(width / designWidth, height / designHeight, 1))
}
export function useFitScale(designWidth = DESIGN_W, designHeight = DESIGN_H) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setScale(
        fitScale(
          entry.contentRect.width,
          entry.contentRect.height,
          designWidth,
          designHeight,
        ),
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [designWidth, designHeight])
  return { ref, scale }
}
export function useWideViewport() {
  const [wide, setWide] = useState(() => window.innerWidth >= 1100)
  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 1100)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return wide
}
