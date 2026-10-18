import type { MotionStyle } from 'motion/react'

/** Optional literal canvas coordinates; any of them positions the node absolutely. */
export interface Geometry {
  x?: number
  y?: number
  width?: number | string
  height?: number | string
}

export function geometryStyle({ x, y, width, height }: Geometry, style?: MotionStyle): MotionStyle {
  const placed = x !== undefined || y !== undefined
  return {
    ...(placed ? { position: 'absolute' as const, left: x ?? 0, top: y ?? 0 } : {}),
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...style,
  }
}
