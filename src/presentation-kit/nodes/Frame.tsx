import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'

export interface FrameProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'children'> {
  id: string
  children?: ReactNode
  /** Optional caption rendered as the first child with a styling hook. */
  label?: string
}

/** Grouping container for related entities. */
export function Frame({ id, label, children, ...rest }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_T}
      data-presentation-node="frame"
      data-presentation-id={id}
      {...rest}
    >
      {label && <span data-presentation-frame-label="">{label}</span>}
      {children}
    </motion.div>
  )
}
