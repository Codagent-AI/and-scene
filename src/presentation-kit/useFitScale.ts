import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT_MIN } from './constants.ts'
import type { DesignSize, Mode } from './types.ts'

export function isWideViewport(width: number): boolean {
  return width >= WIDE_VIEWPORT_MIN
}

/** Horizontal space the table of contents reserves, in px. */
export function reservedSide(mode: Mode, viewportWidth: number): number {
  return mode === 'browse' && isWideViewport(viewportWidth) ? STAGE_LAYOUT.browse.side : 0
}

/** Uniform scale that fits the design canvas into the space the chrome leaves. */
export function computeFitScale(
  viewportWidth: number,
  viewportHeight: number,
  mode: Mode,
  design: DesignSize = { width: DESIGN_W, height: DESIGN_H },
): number {
  const { top, bottom } = STAGE_LAYOUT[mode]
  const availW = Math.max(viewportWidth - reservedSide(mode, viewportWidth), 0)
  const availH = Math.max(viewportHeight - top - bottom, 0)
  const scale = Math.min(availW / design.width, availH / design.height)
  return Number.isFinite(scale) ? Math.max(scale, MIN_SCALE) : MIN_SCALE
}

export function useViewport() {
  const read = () => ({ width: window.innerWidth, height: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export function useFitScale(mode: Mode, design?: DesignSize) {
  const { width, height } = useViewport()
  return computeFitScale(width, height, mode, design)
}
