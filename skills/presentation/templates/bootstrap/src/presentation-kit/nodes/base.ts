import type { ReactNode } from 'react'
import type { HTMLMotionProps, MotionStyle } from 'motion/react'

/** Position and size on the design canvas, in design pixels. */
export interface Rect {
  x: number
  y: number
  w?: number
  h?: number
}

export type NodeProps = Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> & {
  children?: ReactNode
  /** Stable entity identity; also the motion layoutId so the entity morphs across steps. */
  id: string
  at?: Rect
  /** Marks a subtree whose overlaps are intentional and readable. */
  allowOverlap?: boolean
}

/** Geometry only; the kit never sets visual style. */
export function placement(at: Rect | undefined, style: MotionStyle | undefined): MotionStyle {
  if (!at) return { ...style }
  return { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h, ...style }
}

export function nodeAttrs(kind: string, id: string, allowOverlap?: boolean) {
  return {
    'data-presentation-node': kind,
    'data-presentation-entity': id,
    'data-presentation-allow-overlap': allowOverlap ? '' : undefined,
  }
}
