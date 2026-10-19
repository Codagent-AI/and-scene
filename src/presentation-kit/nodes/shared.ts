import type { CSSProperties, HTMLAttributes } from 'react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants.ts'

/** Props every primitive accepts: identity, canvas geometry and styling hooks. */
export interface NodeProps extends Omit<HTMLAttributes<HTMLElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  /** Stable entity identity shared across steps; drives the layout morph. */
  layoutId: string
  x: number
  y: number
  w?: number
  h?: number
}

/** Absolute placement inside the design canvas (layout behaviour, not styling). */
export function place({ x, y, w, h }: Pick<NodeProps, 'x' | 'y' | 'w' | 'h'>, style?: CSSProperties): CSSProperties {
  return { position: 'absolute', left: x, top: y, width: w, height: h, ...style }
}

export const morph = { layout: { duration: LAYOUT_T, ease: EASE } }
export const leave = { opacity: 0, transition: { duration: EXIT_T } }
