import { useEffect, useState, type RefObject } from 'react'
import { MIN_SCALE, STAGE_LAYOUT, WIDE_MIN_PX } from './constants'
import type { Canvas, Mode } from './types'

export interface Size {
  width: number
  height: number
}

/** One uniform factor that fits the canvas inside the available region. */
export function fitScale(avail: Size, canvas: Canvas, mode: Mode): number {
  const { insetX, insetY, maxScale } = STAGE_LAYOUT[mode]
  const s = Math.min((avail.width - 2 * insetX) / canvas.width, (avail.height - 2 * insetY) / canvas.height)
  return Math.max(MIN_SCALE, Math.min(maxScale, s))
}

export function isWide(viewportWidth: number): boolean {
  return viewportWidth >= WIDE_MIN_PX
}

/** Estimated stage region for a viewport, used when the region cannot be measured. */
export function estimateStageRegion(viewport: Size, mode: Mode): Size {
  const { headerH, footerH, tocW } = STAGE_LAYOUT[mode]
  const toc = mode === 'browse' && isWide(viewport.width) ? tocW : 0
  return { width: viewport.width - toc, height: viewport.height - headerH - footerH }
}

export function useViewport(): Size {
  const read = () => ({ width: window.innerWidth, height: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/** Scale for the stage region (measured when possible); constant while the mode and region are. */
export function useFitScale(region: RefObject<HTMLElement | null>, canvas: Canvas, mode: Mode): number {
  const viewport = useViewport()
  const [measured, setMeasured] = useState<Size | null>(null)

  useEffect(() => {
    const el = region.current
    if (!el) return
    const measure = () => {
      const { clientWidth, clientHeight } = el
      setMeasured(clientWidth > 0 && clientHeight > 0 ? { width: clientWidth, height: clientHeight } : null)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [region, mode, viewport.width, viewport.height])

  return fitScale(measured ?? estimateStageRegion(viewport, mode), canvas, mode)
}
