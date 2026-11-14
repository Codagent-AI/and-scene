import { useEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
export function fitScale(width: number, height: number, designWidth = DESIGN_W, designHeight = DESIGN_H) {
  return Math.max(0, Math.min(width / designWidth, height / designHeight))
}
export function useFitScale() {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => setScale(fitScale(node.clientWidth, node.clientHeight))
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    measure()
    return () => observer.disconnect()
  }, [])
  return { ref, scale }
}
