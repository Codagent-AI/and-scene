import { useEffect, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE } from './constants'

/**
 * Computes the uniform scale factor that fits the fixed DESIGN_W x DESIGN_H
 * canvas into a container's actual measured content box, so the composition
 * never reflows internally and never exceeds whatever space the surrounding
 * chrome (header, footer, table of contents) really leaves it, at any
 * viewport size or breakpoint.
 */
export function useFitScale(containerRef: RefObject<HTMLElement | null>): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    function recompute(width: number, height: number) {
      if (width <= 0 || height <= 0) return
      const next = Math.min(width / DESIGN_W, height / DESIGN_H, 1)
      setScale(Math.max(next, MIN_SCALE))
    }

    recompute(node.clientWidth, node.clientHeight)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const box = entry.contentBoxSize?.[0]
      const width = box ? box.inlineSize : entry.contentRect.width
      const height = box ? box.blockSize : entry.contentRect.height
      recompute(width, height)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [containerRef])

  return scale
}
