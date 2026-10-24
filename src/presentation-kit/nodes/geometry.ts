import type { CSSProperties } from 'react'

/** Absolute placement on the design canvas. Geometry is layout, not visual style. */
export interface Geometry {
  x?: number
  y?: number
  w?: number
  h?: number
}

export function geometryStyle({ x, y, w, h }: Geometry, style?: CSSProperties): CSSProperties {
  const placed = x !== undefined || y !== undefined
  return {
    ...(placed ? { position: 'absolute' as const } : null),
    left: x,
    top: y,
    width: w,
    height: h,
    ...style,
  }
}
