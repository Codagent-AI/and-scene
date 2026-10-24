import type { CSSProperties } from 'react'

/** Absolute placement on the design canvas. Omit to let the node flow normally. */
export interface Placement {
  x?: number
  y?: number
  w?: number
  h?: number
}

export function placementStyle({ x, y, w, h }: Placement): CSSProperties {
  const absolute = x !== undefined || y !== undefined
  return {
    ...(absolute ? { position: 'absolute' as const } : null),
    ...(x !== undefined ? { left: x } : null),
    ...(y !== undefined ? { top: y } : null),
    ...(w !== undefined ? { width: w } : null),
    ...(h !== undefined ? { height: h } : null),
  }
}

export type Point = readonly [number, number]

export function arrowPath(from: Point, to: Point, bend?: Point): string {
  const [fx, fy] = from
  const [tx, ty] = to
  const [cx, cy] = bend ?? [(fx + tx) / 2, (fy + ty) / 2]
  return `M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`
}

