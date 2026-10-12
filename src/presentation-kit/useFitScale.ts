import { useEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE } from './constants'

export { DESIGN_H, DESIGN_W }
export function fitScale(width: number, height: number, designWidth = DESIGN_W, designHeight = DESIGN_H): number {
  if (width <= 0 || height <= 0) return 1
  return Math.max(MIN_SCALE, Math.min(width / designWidth, height / designHeight))
}
export function useFitScale(ref: RefObject<HTMLElement | null>): number {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => setScale(fitScale(node.clientWidth, node.clientHeight))
    update()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update)
      observer.observe(node)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [ref])
  return scale
}
