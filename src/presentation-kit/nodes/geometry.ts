import type { CSSProperties } from 'react'

export interface Geometry {
  x?: number
  y?: number
  w?: number
  h?: number
}

/** Absolute placement inside the fixed design canvas; only layout, no visual style. */
export function geometryStyle({ x, y, w, h }: Geometry, style?: CSSProperties): CSSProperties {
  const positioned = x !== undefined || y !== undefined
  return {
    ...(positioned ? { position: 'absolute' as const } : null),
    left: x,
    top: y,
    width: w,
    height: h,
    ...style,
  }
}
