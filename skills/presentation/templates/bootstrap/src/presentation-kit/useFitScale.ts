import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { PresentationMode } from './types'

export interface UseFitScaleResult {
  scale: number
  containerRef: RefObject<HTMLDivElement | null>
}

/** Uniform fit-to-viewport scale for the fixed design canvas, per active mode. */
export function useFitScale(
  mode: PresentationMode,
  designWidth: number = DESIGN_W,
  designHeight: number = DESIGN_H,
): UseFitScaleResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function computeScale() {
      const geometry = STAGE_LAYOUT[mode]
      // Prefer the container's own measured box (it already reflects real
      // layout — e.g. a sibling table of contents narrowing it) over
      // `window.innerWidth`/`innerHeight`, which know nothing about host
      // layout and would overestimate space next to any sibling chrome.
      const container = containerRef.current
      const containerWidth = container?.clientWidth ?? window.innerWidth
      const containerHeight =
        container?.clientHeight ??
        window.innerHeight - geometry.headerHeight - geometry.footerHeight
      const availableWidth = containerWidth - geometry.sidePadding * 2
      const availableHeight = containerHeight - geometry.topPadding - geometry.bottomPadding
      const fitted = Math.min(availableWidth / designWidth, availableHeight / designHeight)
      setScale(Number.isFinite(fitted) ? Math.max(MIN_SCALE, fitted) : MIN_SCALE)
    }

    computeScale()
    window.addEventListener('resize', computeScale)

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(computeScale)
      observer.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', computeScale)
      observer?.disconnect()
    }
  }, [mode, designWidth, designHeight])

  return { scale, containerRef }
}
