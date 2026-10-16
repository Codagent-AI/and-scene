import type { CSSProperties } from 'react'

/** Layout-only placement on the 880 × 380 canvas (px). */
export interface Placement {
  x?: number
  y?: number
  w?: number
  h?: number
}

export function placementStyle({ x, y, w, h }: Placement, style?: CSSProperties): CSSProperties {
  const hasPos = x !== undefined || y !== undefined
  return {
    ...(hasPos ? { position: 'absolute' as const } : null),
    ...(x !== undefined ? { left: x } : null),
    ...(y !== undefined ? { top: y } : null),
    ...(w !== undefined ? { width: w } : null),
    ...(h !== undefined ? { height: h } : null),
    ...style,
  }
}
