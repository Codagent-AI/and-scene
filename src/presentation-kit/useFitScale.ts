import { useEffect, useRef, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

/**
 * Uniform fit scale for the fixed design canvas within the active mode's
 * stage geometry, so the composition never reflows and layout morphs stay
 * clean across viewport sizes. Pass `reserveToc` when the table of contents
 * is shown so its side gutters are excluded from the available width.
 */
export function useFitScale(mode: Mode, reserveToc = false): number {
  const [scale, setScale] = useState(1)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    function measure() {
      const layout = STAGE_LAYOUT[mode]
      const availableWidth = Math.max(window.innerWidth - (reserveToc ? 2 * layout.tocGutter : 0), 1)
      const availableHeight = Math.max(window.innerHeight - layout.chromeTop - layout.chromeBottom, 1)
      const widthScale = availableWidth / DESIGN_W
      const heightScale = availableHeight / DESIGN_H
      setScale(Math.max(Math.min(widthScale, heightScale), MIN_SCALE))
    }

    measure()

    function scheduleMeasure() {
      if (frameRef.current != null) return
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null
        measure()
      })
    }

    window.addEventListener('resize', scheduleMeasure)
    return () => {
      window.removeEventListener('resize', scheduleMeasure)
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [mode, reserveToc])

  return scale
}
