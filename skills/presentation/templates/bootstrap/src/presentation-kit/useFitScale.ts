import { useEffect, useRef, useState, type RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export interface UseFitScaleResult {
  containerRef: RefObject<HTMLDivElement | null>
  scale: number
}

/**
 * Uniformly scales the fixed `DESIGN_W x DESIGN_H` canvas to fit the space
 * available in `containerRef` for the given mode's chrome geometry, so the
 * composition never reflows and `layoutId` morphs stay clean across sizes.
 */
export function useFitScale(mode: PresentationMode): UseFitScaleResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const layout = STAGE_LAYOUT[mode]

    function measure() {
      const rect = node!.getBoundingClientRect()
      const availableWidth = Math.max(rect.width - layout.sidePadding * 2, 0)
      const availableHeight = Math.max(rect.height - layout.reservedTop - layout.reservedBottom, 0)
      const fit = Math.min(availableWidth / DESIGN_W, availableHeight / DESIGN_H)
      setScale(Number.isFinite(fit) ? Math.max(fit, MIN_SCALE) : MIN_SCALE)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [mode])

  return { containerRef, scale }
}
