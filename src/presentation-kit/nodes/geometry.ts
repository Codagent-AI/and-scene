import type { CSSProperties } from 'react'

/** Canvas-coordinate placement shared by all positioned primitives. */
export interface Placement {
  x?: number
  y?: number
  w?: number
  h?: number
}

export function placementStyle({ x, y, w, h }: Placement, style?: CSSProperties): CSSProperties {
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
