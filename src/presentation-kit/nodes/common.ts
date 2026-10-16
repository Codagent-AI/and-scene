import type { CSSProperties, ReactNode } from 'react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'

/** Position and size in design-canvas coordinates. */
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

/** Geometry-only inline style for an absolutely positioned entity. */
export function rectStyle(at: Rect | undefined, style?: CSSProperties): CSSProperties {
  if (!at) return { ...style }
  return { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h, ...style }
}

export const LAYOUT_TRANSITION = { duration: LAYOUT_T, ease: EASE }

type Tag = 'div' | 'span'

/** Props every motion-backed primitive accepts: motion props plus plain CSS style and children. */
export type NodeProps<T extends Tag> = Omit<HTMLMotionProps<T>, 'id' | 'layoutId' | 'style' | 'children'> & {
  style?: CSSProperties
  children?: ReactNode
}
