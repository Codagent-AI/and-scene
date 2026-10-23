import type { MotionStyle } from 'motion/react'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Absolute placement inside the design canvas; author `style` always wins. */
export function placeStyle(at: Rect | undefined, style: MotionStyle | undefined): MotionStyle | undefined {
  if (!at) return style
  return { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h, ...style }
}
