import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { LAYOUT_T } from '../constants'
import { rectStyle, type Rect } from './geometry'

export interface EntityProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'children'> {
  /** Stable entity identity, used as the layoutId. */
  id: string
  /** Absolute placement on the design canvas. */
  at?: Rect
  children?: ReactNode
}

/** Shared base for layoutId nodes: stable identity, placement, and hooks, no visual style. */
export function Entity({ kind, id, at, style, children, ...rest }: EntityProps & { kind: string }) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_T}
      data-presentation-node={kind}
      data-presentation-id={id}
      style={rectStyle(at, style)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
