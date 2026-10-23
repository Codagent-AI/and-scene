import type { CSSProperties } from 'react'

export interface GeometryProps {
  x?: number
  y?: number
  width?: number
  height?: number
}

/** Placement-only inline style: absolute coordinates when any geometry is given. */
export function geometryStyle({ x, y, width, height }: GeometryProps): CSSProperties {
  if (x === undefined && y === undefined && width === undefined && height === undefined) return {}
  return { position: 'absolute', left: x, top: y, width, height }
}
