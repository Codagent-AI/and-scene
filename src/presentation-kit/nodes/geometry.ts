import type { MotionStyle } from 'motion/react'

export interface Rect {
  x: number
  y: number
  w?: number
  h?: number
}

export interface Point {
  x: number
  y: number
}

/** Absolute placement on the design canvas: layout geometry only, no visual style. */
export function rectStyle(at: Rect | undefined, style?: MotionStyle): MotionStyle {
  if (!at) return { ...style }
  return { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h, ...style }
}
