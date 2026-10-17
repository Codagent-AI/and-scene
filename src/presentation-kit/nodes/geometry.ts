import type { CSSProperties } from 'react'

export interface Geometry {
  x?: number
  y?: number
  w?: number
  h?: number
}

/** Absolute placement on the design canvas; layout plumbing, not visual style. */
export function geometryStyle({ x, y, w, h }: Geometry): CSSProperties {
  return { position: 'absolute', left: x, top: y, width: w, height: h }
}
