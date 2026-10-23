import { useEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE } from './constants'

/** Uniform scale that fits the design canvas into the available box. */
export function fitScale(
  availW: number,
  availH: number,
  designW = DESIGN_W,
  designH = DESIGN_H,
): number {
  if (!(availW > 0) || !(availH > 0)) return MIN_SCALE
  return Math.max(MIN_SCALE, Math.min(availW / designW, availH / designH))
}

/** Measures the returned ref's box and derives the uniform fit scale from it. */
export function useFitScale(designW = DESIGN_W, designH = DESIGN_H) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(MIN_SCALE)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () =>
      setScale(fitScale(el.clientWidth, el.clientHeight, designW, designH))
    measure()
    window.addEventListener('resize', measure)
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(el)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [designW, designH])

  return { ref, scale }
}
