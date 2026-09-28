import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export interface LabelProps {
  layoutId?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** A generic text label primitive that can carry a layoutId to morph in place. */
export function Label({ layoutId, className, style, children }: LabelProps) {
  return (
    <motion.span layoutId={layoutId} data-presentation-node="label" className={className} style={style}>
      {children}
    </motion.span>
  )
}
