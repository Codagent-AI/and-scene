import type { MotionStyle } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

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

/** Shared-layout identity and the stable hooks every scene entity carries. */
export function entityProps(entity: string, hook: string) {
  return {
    layout: true,
    layoutId: entity,
    transition: { duration: LAYOUT_T, ease: EASE },
    [`data-presentation-${hook}`]: '',
    'data-presentation-entity': entity,
  } as const
}
